#!/bin/bash

echo "🚀 Ejecutando pruebas con Cucumber para SkillTrade"
echo "=================================================="

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo ""
echo "🧪 Ejecutando todas las pruebas..."
npm test

echo ""
echo "📊 Generando reportes..."
echo "Reportes disponibles en:"
echo "- reports/cucumber_report.html"
echo "- reports/cucumber_report.json"

echo ""
echo "✅ Pruebas completadas!"


