
import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function obtenerPaciente(cedula) {

  const response = await notion.databases.query({
    database_id: process.env.NOTION_PATIENTS_DB,
    filter: {
      property: "Cedula",
      rich_text: {
        equals: cedula,
      },
    },
  });

  if (response.results.length === 0) {
    return null;
  }

  const paciente = response.results[0].properties;

  return {
    nombre: paciente.Nombre.title[0]?.plain_text,
    plan: paciente["Plan"].select.name,
    diasAfiliado: paciente.DiasAfiliado.number,
    cedula: paciente.Cedula?.rich_text?.[0]?.plain_text || cedula,
  };
}

export async function obtenerRegla(plan, especialidad) {

  const response = await notion.databases.query({
    database_id: process.env.NOTION_RULES_DB,
    filter: {
      and: [
        {
          property: "Plan",
          select: {
            equals: plan,
          },
        },
        {
          property: "Especialidad",
          rich_text: {
            equals: especialidad,
          },
        },
      ],
    },
  });

  if (response.results.length === 0) {
    return null;
  }

  const regla = response.results[0].properties;

  return {
    cobertura: regla.Cobertura.checkbox,
    carencia: regla.Carencia.number,
  };
}