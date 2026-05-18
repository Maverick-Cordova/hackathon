import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";


import PDFParser from "pdf2json";

import {
  detectarEspecialidadIA,
  extraerCedulaIA,
} from "./services/gemini.service.js";

import {
  obtenerPaciente,
  obtenerRegla,
} from "./services/notion.service.js";

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.post(
  "/preautorizacion",
  upload.single("archivo"),
  async (req, res) => {

    try {

      let { cedula } = req.body;
      let cedulaDetectada = null;

      if (!req.file) {
        return res.status(400).json({
          error: "Debe subir un PDF",
        });
      }

      // 1. Extraer texto del PDF primero
      const textoPDF = await new Promise(
        (resolve, reject) => {

          const pdfParser = new PDFParser();

          pdfParser.on(
            "pdfParser_dataError",
            err => reject(err)
          );

          pdfParser.on(
            "pdfParser_dataReady",
            pdfData => {

              let texto = "";

              pdfData.Pages.forEach(page => {

                page.Texts.forEach(text => {

                  text.R.forEach(r => {

                    texto += decodeURIComponent(r.T) + " ";
                  });
                });
              });

              resolve(texto);
            }
          );

          pdfParser.loadPDF(req.file.path);
        }
      );

      console.log("Texto del PDF extraído con éxito.");

      // 2. Si no se especificó la cédula, usar la IA para buscarla en el reporte
      if (!cedula || cedula.trim() === "") {
        console.log("Cédula no proporcionada. Usando Gemini IA para extraerla...");
        const cedulaExtraida = await extraerCedulaIA(textoPDF);
        console.log("Cédula detectada por IA:", cedulaExtraida);

        if (!cedulaExtraida || cedulaExtraida === "NO_ENCONTRADA") {
          return res.status(400).json({
            error: "No se proporcionó una cédula y no pudimos detectarla en el PDF. Por favor, ingrésela manualmente.",
          });
        }

        cedula = cedulaExtraida;
        cedulaDetectada = cedulaExtraida;
      }

      // 3. Buscar al paciente en Notion
      const paciente = await obtenerPaciente(cedula);

      if (!paciente) {
        return res.status(404).json({
          error: "Paciente no encontrado",
          cedula: cedulaDetectada, // Retornamos la cédula auto-detectada para autocompletar en el frontend
        });
      }

      // Aseguramos que el objeto paciente tenga la cédula
      paciente.cedula = cedula;

      // 4. Detectar la especialidad clínica con Gemini
      const especialidad = await detectarEspecialidadIA(textoPDF);

      console.log("ESPECIALIDAD DETECTADA:", especialidad);

      // 5. Validar reglas de seguro clínico en Notion
      const regla = await obtenerRegla(paciente.plan, especialidad);

      if (!regla) {
        return res.json({
          aprobado: false,
          especialidad,
          motivo: "No existe regla de cobertura",
          paciente,
        });
      }

      if (!regla.cobertura) {
        return res.json({
          aprobado: false,
          especialidad,
          motivo: "El plan no cubre esta especialidad",
          paciente,
        });
      }

      if (paciente.diasAfiliado < regla.carencia) {
        return res.json({
          aprobado: false,
          especialidad,
          motivo: "No cumple tiempo mínimo de carencia",
          paciente,
        });
      }

      return res.json({
        aprobado: true,
        especialidad,
        motivo: "Procedimiento aprobado correctamente",
        paciente,
      });

    } catch (error) {

      console.log("ERROR EN /preautorizacion:", error);

      return res.status(500).json({
        error: error.message,
      });
    }
  }
);

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});