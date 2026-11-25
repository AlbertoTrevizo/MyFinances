# Spec: Inicio

**Estado:** Aprobada el 2026-11-24, solo para INI-1 e INI-2. Los paneles de presupuesto están en `specs/budget/spec.md`. El resto del inicio (totales, gráficas y tabla del mes) todavía no tiene reglas escritas. Se documentará la próxima vez que se cambie.
**Ruta:** `/`

## Propósito
Resumir los gastos de un mes del hogar.

## Reglas

### Mes
- **INI-1.** El mes elegido va en la URL como `month=AAAA-MM`. Sin `month`, o con un valor inválido, se muestra el mes actual según la hora de México (`America/Mexico_City`). El selector ofrece los meses que tienen gastos y el mes actual.
- **INI-2.** Todo nombre de mes con año se muestra con el mes con mayúscula inicial y sin "de": "Noviembre 2026" en español y "November 2026" en inglés. El mismo formato se usa en Gastos (GAS-20). Dentro de una frase, el mes va en minúscula en español: "No hay gastos en noviembre 2026" (GAS-33).
