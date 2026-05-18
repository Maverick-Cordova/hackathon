export function detectarEspecialidad(procedimiento) {

  const texto = procedimiento.toLowerCase();

  if (
    texto.includes("menisco") ||
    texto.includes("rodilla") ||
    texto.includes("fractura")
  ) {
    return "Traumatología";
  }

  if (
    texto.includes("corazon") ||
    texto.includes("cardi")
  ) {
    return "Cardiología";
  }

  return "General";
}