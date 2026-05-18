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