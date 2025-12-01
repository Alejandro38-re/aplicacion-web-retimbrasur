# 🔥 Sistema de Inspección Contra Incendios

## Descripción

Aplicación web moderna para que los técnicos realicen inspecciones de equipos contra incendios, generen informes profesionales y exporten los datos a Excel para integración con AppSheet.

## ✨ Características Principales

### 1. **Múltiples Tipos de Equipos**
- 🧯 Extintores (12 puntos de verificación)
- 🚰 BIEs - Bocas de Incendio Equipadas (15 puntos)
- ⚙️ Grupos de Presión (18 puntos)
- 🚿 Hidrantes y Monitores (14 puntos)
- 💨 Extinción por Gas (20 puntos)
- 💧 Sprinklers (16 puntos)
- 🌊 Agua Pulverizada - Diluvio (17 puntos)
- 🔔 Sistemas de Detección (22 puntos)
- 🧼 Sistemas de Espuma (19 puntos)
- 🚪 Puertas Resistentes al Fuego (10 puntos)

### 2. **Gestión de Inspecciones**
- ✅ Checklists personalizados por tipo de equipo
- 📝 Formularios intuitivos con validación
- 💾 Guardar borradores
- 📊 Seguimiento de progreso en tiempo real
- 🎯 Estados de verificación: Conforme, Observación, No Conforme

### 3. **Informes Profesionales**
- 📄 Generación automática de informes
- 🎨 Diseño profesional y estructurado
- 📈 Resumen visual de resultados
- 🖨️ Exportación a PDF
- 📋 Observaciones y recomendaciones

### 4. **Exportación de Datos**
- 📊 Exportación a CSV/Excel
- 🔗 Compatible con AppSheet
- 📅 Incluye todas las inspecciones realizadas
- 💼 Formato optimizado para análisis

### 5. **Historial Completo**
- 📚 Registro de todas las inspecciones
- 🔍 Filtrado por tipo de equipo
- 👁️ Visualización de inspecciones anteriores
- ✏️ Edición de borradores guardados

## 🚀 Cómo Usar la Aplicación

### Paso 1: Iniciar una Inspección
1. Abre `index.html` en tu navegador
2. Selecciona el tipo de equipo que vas a inspeccionar
3. Se abrirá el formulario de inspección

### Paso 2: Completar la Información
1. **Información del Equipo:**
   - ID del Equipo (ej: EXT-001)
   - Ubicación (ej: Planta 1, Pasillo A)
   - Fecha de Inspección
   - Nombre del Técnico

2. **Lista de Verificación:**
   - Marca cada punto verificado ✓
   - Selecciona el estado:
     - ✓ Conforme: Todo correcto
     - ⚠ Observación: Requiere atención
     - ✗ No Conforme: Problema crítico
     - Sin revisar: No verificado

3. **Observaciones:**
   - Añade observaciones generales
   - Incluye recomendaciones de mantenimiento

### Paso 3: Guardar o Completar
- **Guardar Borrador:** Guarda el progreso para continuar después
- **Completar Inspección:** Finaliza y genera el informe

### Paso 4: Ver el Informe
- Se mostrará un informe profesional con:
  - Información del equipo
  - Resumen de resultados
  - Lista detallada de verificación
  - Observaciones y recomendaciones
- Descarga el PDF para archivo o impresión

## 📊 Exportar Datos a AppSheet

### Exportación
1. Haz clic en el botón **"Exportar Datos"** en el header
2. Se descargará un archivo CSV con todas las inspecciones
3. El archivo incluye:
   - ID único de inspección
   - Tipo de equipo
   - ID del equipo
   - Ubicación
   - Fecha de inspección
   - Técnico responsable
   - Estado (Completada/Borrador)
   - Contadores de resultados
   - Observaciones y recomendaciones
   - Fecha de creación

### Importar a AppSheet
1. Sube el archivo CSV a Google Drive o Dropbox
2. En AppSheet, crea una nueva app o añade una tabla
3. Selecciona el archivo CSV como fuente de datos
4. AppSheet detectará automáticamente las columnas
5. Configura las vistas y acciones según tus necesidades

## 💾 Almacenamiento de Datos

Los datos se guardan localmente en el navegador usando **localStorage**:
- ✅ No requiere conexión a internet
- ✅ Datos persistentes entre sesiones
- ✅ Privacidad total (datos en el dispositivo)
- ⚠️ Importante: Exporta regularmente para backup

## 🎨 Características de Diseño

- **Tema Oscuro Moderno:** Reduce fatiga visual
- **Animaciones Suaves:** Experiencia fluida
- **Diseño Responsive:** Funciona en móvil y desktop
- **Glassmorphism:** Efectos visuales modernos
- **Gradientes Vibrantes:** Interfaz atractiva
- **Micro-interacciones:** Feedback visual inmediato

## 📱 Compatibilidad

- ✅ Chrome, Edge, Firefox, Safari
- ✅ Dispositivos móviles (iOS/Android)
- ✅ Tablets
- ✅ Desktop

## 🔧 Personalización

### Añadir Nuevos Tipos de Equipos
Edita `app.js` y añade un nuevo objeto en `equipmentTypes`:

```javascript
'nuevo-equipo': {
    name: 'Nombre del Equipo',
    icon: '🔧',
    checklist: [
        'Punto de verificación 1',
        'Punto de verificación 2',
        // ... más puntos
    ]
}
```

Luego añade la tarjeta correspondiente en `index.html`.

### Modificar Checklists
Edita el array `checklist` del tipo de equipo correspondiente en `app.js`.

### Cambiar Colores
Modifica las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #ff6b35;  /* Color principal */
    --secondary-color: #004e89; /* Color secundario */
    /* ... más variables */
}
```

## 📋 Estructura de Archivos

```
aplicacion informes/
├── index.html              # Estructura HTML
├── styles.css              # Estilos y diseño
├── app.js                  # Lógica de la aplicación
├── Logo.jpg                # Logo de la empresa
└── INFORME CONTRA INCENDIOS MODELO EN BLANCO.xlsx
```

## 🆘 Solución de Problemas

### Los datos no se guardan
- Verifica que el navegador permita localStorage
- Comprueba que no estés en modo incógnito
- Exporta los datos regularmente como backup

### El PDF no se genera
- Asegúrate de que el navegador permita ventanas emergentes
- Usa la función de imprimir del navegador (Ctrl+P)

### La aplicación no carga
- Verifica que todos los archivos estén en la misma carpeta
- Abre la consola del navegador (F12) para ver errores
- Asegúrate de usar un navegador moderno actualizado

## 🔐 Seguridad y Privacidad

- ✅ Todos los datos se almacenan localmente
- ✅ No se envía información a servidores externos
- ✅ No requiere registro ni login
- ✅ Control total sobre tus datos

## 📈 Próximas Mejoras

- [ ] Sincronización con la nube
- [ ] Firma digital del técnico
- [ ] Adjuntar fotos a las inspecciones
- [ ] Generación de códigos QR para equipos
- [ ] Notificaciones de mantenimiento programado
- [ ] Dashboard de estadísticas
- [ ] Modo offline completo con Service Workers

## 📞 Soporte

Para soporte técnico o sugerencias, contacta con el administrador del sistema.

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025  
**Desarrollado para:** Técnicos de Protección Contra Incendios
