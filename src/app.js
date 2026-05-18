// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { obtenerPaciente } from "./services/notion.service.js";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("API funcionando");
// });

// app.get("/paciente/:cedula", async (req, res) => {
//   const paciente = await obtenerPaciente(req.params.cedula);

//   res.json(paciente);
// });

// app.listen(3000, () => {
//   console.log("Servidor en puerto 3000");
// });


import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  obtenerPaciente,
  obtenerRegla,
} from "./services/notion.service.js";

import {
  detectarEspecialidad,
} from "./services/ia.service.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.get("/paciente/:cedula", async (req, res) => {

  const paciente = await obtenerPaciente(
    req.params.cedula
  );

  res.json(paciente);
});

app.post("/evaluar", async (req, res) => {

  try {

    const {
      cedula,
      procedimiento,
    } = req.body;

    const paciente = await obtenerPaciente(
      cedula
    );

    if (!paciente) {
      return res.status(404).json({
        error: "Paciente no encontrado",
      });
    }

    const especialidad =
      detectarEspecialidad(procedimiento);

    const regla = await obtenerRegla(
      paciente.plan,
      especialidad
    );

    if (!regla) {
      return res.json({
        aprobado: false,
        motivo: "No existe regla de cobertura",
      });
    }

    if (!regla.cobertura) {
      return res.json({
        aprobado: false,
        motivo: "El plan no cubre esta especialidad",
      });
    }

    if (
      paciente.diasAfiliado < regla.carencia
    ) {
      return res.json({
        aprobado: false,
        motivo:
          "No cumple tiempo mínimo de carencia",
      });
    }

    return res.json({
      aprobado: true,
      especialidad,
      motivo:
        "Procedimiento aprobado correctamente",
      paciente,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});