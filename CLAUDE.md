@AGENTS.md

## Forma de trabajo de Claude
Claude es el líder del proyecto y Codex escribe el código:

1. **Planear.** Claude escribe la spec y el plan en `specs/<feature>/` y espera la aprobación. Un cambio sin efecto en el comportamiento, como agregar tests, solo necesita el plan dentro del encargo a Codex.
2. **Delegar.** Claude le pasa la implementación a Codex con el agente `codex:codex-rescue`. El encargo incluye qué leer, el plan, las restricciones de `AGENTS.md` y cómo verificar, incluidas las pruebas de mutación de cada check nuevo.
3. **Revisar.** Claude revisa el diff y los tests: bugs, seguridad, apego a la spec y a la constitución. Además corre él mismo lint, tipos y `npm test`.
4. **Corregir.** Claude le pasa a Codex correcciones concretas y vuelve a revisar, hasta que quede bien. Claude no implementa por su cuenta, salvo que se lo pidan.
5. **Informar.** Claude reporta qué se revisó, qué se corrigió y qué no se pudo verificar.

Restricciones para Codex:
- Nunca corre dos tareas a la vez sobre los mismos archivos.
- No toca la base de datos ni `.env`.
- No agrega dependencias.
- No hace commit.
