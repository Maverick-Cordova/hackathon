import axios from "axios";

export const detectarEspecialidadIA =
  async (textoPDF) => {

    const GEMINI_API_KEY =
      process.env.GEMINI_API_KEY;

    const prompt = `
Analiza el siguiente informe médico.

Debes identificar la especialidad médica correcta.

SOLO puedes responder UNA de estas opciones exactas:

- Traumatología
- Cardiología
- Dermatología
- Pediatría
- Neurología

Informe médico:
${textoPDF}

Responde únicamente con una especialidad exacta.
`;

    try {

      const response =
        await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }
        );

      return response.data
        .candidates[0]
        .content.parts[0]
        .text.trim();

    } catch (error) {

      console.log(
        "ERROR REAL:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        )
      );

      throw new Error(
        error.response?.data?.error?.message
      );
    }
  };


export const extraerCedulaIA =
  async (textoPDF) => {

    const GEMINI_API_KEY =
      process.env.GEMINI_API_KEY;

    const prompt = `
Analiza el siguiente informe médico.
Debes buscar el número de cédula de identidad del paciente.
En Ecuador, las cédulas de identidad tienen exactamente 10 dígitos numéricos (por ejemplo: 0944329077, 1723456789).

Informe médico:
${textoPDF}

Responde únicamente con los 10 dígitos numéricos de la cédula encontrada, sin espacios, guiones ni texto adicional.
Si NO encuentras ningún número que cumpla con el formato de una cédula de identidad ecuatoriana de 10 dígitos en el texto, responde ÚNICAMENTE con la palabra: NO_ENCONTRADA
`;

    try {

      const response =
        await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }
        );

      return response.data
        .candidates[0]
        .content.parts[0]
        .text.trim();

    } catch (error) {

      console.log(
        "ERROR REAL EN EXTRACCIÓN DE CÉDULA:",
        JSON.stringify(
          error.response?.data,
          null,
          2
        )
      );

      throw new Error(
        error.response?.data?.error?.message || error.message
      );
    }
  };