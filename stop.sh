#!/bin/bash
# Stop script for Payroll Node Server
echo "🛑 Deteniendo Servidor de Planilla Node.js (Soda El Parque)..."
PID=$(lsof -t -i:3000)
if [ -z "$PID" ]; then
  echo "El servidor ya se encuentra detenido (Puerto 3000 libre)."
else
  kill -9 $PID
  echo "Servidor detenido exitosamente (Proceso $PID terminado)."
fi
