# 🔄 Configuración de Sincronización con AppSheet

Esta guía explica cómo configurar la sincronización automática con AppSheet y Google Drive.

## 📋 Requisitos Previos

1. **Cuenta de AppSheet** activa
2. **Aplicación AppSheet** creada para gestionar inspecciones
3. **API de AppSheet** habilitada
4. **Google Drive** configurado para almacenamiento de fotos

## 🔧 Pasos de Configuración

### 1. Obtener Credenciales de AppSheet

1. Ve a [AppSheet](https://www.appsheet.com/)
2. Abre tu aplicación
3. Ve a **Settings** → **Integrations** → **API**
4. Copia las siguientes credenciales:
   - **Application ID** (App ID)
   - **API Key** (Application Access Key)
   - **API URL** (normalmente: `https://api.appsheet.com/api/v2/apps/`)

### 2. Configurar la Aplicación Web

Abre el archivo `app.js` y busca la sección **APPSHEET_CONFIG** (aproximadamente línea 2935):

```javascript
const APPSHEET_CONFIG = {
    apiUrl: '', // ← Pega aquí tu AppSheet API URL
    appId: '', // ← Pega aquí tu Application ID
    apiKey: '', // ← Pega aquí tu API Key
    tableName: 'Inspecciones', // ← Nombre de tu tabla en AppSheet
    photosTableName: 'Fotos', // ← Nombre de tabla de fotos (opcional)
    driveFolder: 'RETIMBRASUR_Photos', // ← Carpeta en Google Drive
    maxRetries: 3,
    retryDelay: 2000
};
```

**Ejemplo de configuración completa:**

```javascript
const APPSHEET_CONFIG = {
    apiUrl: 'https://api.appsheet.com/api/v2/apps/12345abc-6789-def0-1234-56789abcdef0',
    appId: 'MiApp-123456',
    apiKey: 'V2-AbCdE-FgHiJ-KlMnO-PqRsT',
    tableName: 'Inspecciones',
    photosTableName: 'Fotos',
    driveFolder: 'RETIMBRASUR_Photos',
    maxRetries: 3,
    retryDelay: 2000
};
```

### 3. Configurar Tablas en AppSheet

#### Tabla: **Inspecciones**

Crea una tabla en AppSheet con las siguientes columnas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID | Text | ID único de la inspección |
| WorkCenterId | Text | ID del centro de trabajo |
| WorkCenterName | Text | Nombre del centro |
| EquipmentType | Text | Tipo de equipo |
| EquipmentId | Text | ID del equipo |
| Location | Text | Ubicación del equipo |
| InspectionDate | Date | Fecha de inspección |
| Technician | Text | Nombre del técnico |
| TechnicianId | Text | ID del técnico |
| Manufacturer | Text | Fabricante |
| Brand | Text | Marca |
| Model | Text | Modelo |
| ManufacturingDate | Date | Fecha de fabricación |
| LastRetestDate | Date | Último retimbrado |
| TotalItems | Number | Total de ítems |
| CheckedItems | Number | Ítems verificados |
| OkCount | Number | Conformes |
| WarningCount | Number | Advertencias |
| ErrorCount | Number | Errores |
| CompletionPercentage | Number | % Completado |
| ChecklistData | LongText | JSON de checklist |
| Observations | LongText | Observaciones |
| Recommendations | LongText | Recomendaciones |
| PhotoUrls | LongText | URLs de fotos (separadas por coma) |
| PhotoCount | Number | Cantidad de fotos |
| TechnicianSignature | Image | Firma del técnico |
| ClientSignature | Image | Firma del cliente |
| Status | Text | Estado (draft/completed) |
| CreatedAt | DateTime | Fecha de creación |
| UpdatedAt | DateTime | Última modificación |
| SyncedAt | DateTime | Fecha de sincronización |

#### Tabla: **Fotos** (Opcional)

Para gestión individual de fotos:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID | Text | ID único |
| InspectionId | Ref → Inspecciones | Referencia a inspección |
| PhotoUrl | Image | URL de la foto |
| PhotoOrder | Number | Orden de la foto |
| UploadedAt | DateTime | Fecha de subida |

### 4. Configurar Google Drive

1. En AppSheet, ve a **Data** → **Tables** → **Inspecciones**
2. Para las columnas de tipo **Image** (TechnicianSignature, ClientSignature):
   - Marca **Allow images**
   - Selecciona **Google Drive** como almacenamiento
   - Configura la carpeta: `RETIMBRASUR_Photos`

### 5. Habilitar API en AppSheet

1. Ve a **Settings** → **Integrations** → **IN: from cloud services**
2. Activa **Enable** para permitir llamadas API
3. Ve a **Settings** → **Integrations** → **OUT: to cloud services**
4. Activa **Enable** para permitir respuestas API

## 🚀 Uso de la Sincronización

### Sincronización Manual

1. Haz clic en el botón **🔄 Sincronizar** en la cabecera de la aplicación
2. El indicador de color muestra el estado:
   - 🟢 Verde: Todo sincronizado
   - 🟠 Naranja: Hay inspecciones pendientes de sincronizar
   - 🔵 Azul (pulsante): Sincronización en curso

### Sincronización Automática

La aplicación sincroniza automáticamente:
- ✅ Al completar una inspección (si hay conexión a Internet)
- ✅ Al recuperar conexión después de estar offline
- ✅ Cada vez que se detecta una nueva inspección no sincronizada

### Modo Offline

- La aplicación funciona **completamente offline**
- Los datos se guardan en localStorage del navegador
- Las fotos se guardan en formato Base64
- Al recuperar conexión, se sincronizan automáticamente

## 🔍 Verificación

### Comprobar Configuración

Abre la consola del navegador (F12) y busca:

```
✅ AppSheet synchronization module initialized
ℹ️ Configure APPSHEET_CONFIG in app.js to enable synchronization
```

Si ves advertencias de configuración incompleta, revisa los pasos anteriores.

### Probar Sincronización

1. Completa una inspección de prueba
2. Haz clic en **🔄 Sincronizar**
3. Verifica en AppSheet que los datos aparezcan
4. Revisa Google Drive para confirmar que las fotos se subieron

## 🐛 Solución de Problemas

### Error: "AppSheet no está configurado"

**Causa:** Falta configurar `apiUrl`, `appId` o `apiKey`
**Solución:** Completa todos los campos de `APPSHEET_CONFIG` en app.js

### Error: "Upload failed: 401 Unauthorized"

**Causa:** API Key inválida o expirada
**Solución:** Genera una nueva API Key en AppSheet

### Error: "AppSheet API error: 404"

**Causa:** La URL o el nombre de la tabla son incorrectos
**Solución:** Verifica que `apiUrl` y `tableName` coincidan con tu app

### Las fotos no se suben

**Causa:** Google Drive no está configurado correctamente
**Solución:** Verifica la configuración de almacenamiento en AppSheet

### Sincronización lenta

**Causa:** Fotos muy grandes o conexión lenta
**Solución:** La compresión de imágenes ya está activa (max 1024px, 80% quality)

## 📊 Datos Sincronizados

La sincronización incluye:

- ✅ Información del equipo
- ✅ Datos de la inspección
- ✅ Checklist completo con resultados
- ✅ Observaciones y recomendaciones
- ✅ Hasta 5 fotos por equipo (comprimidas)
- ✅ Firmas digitales (técnico y cliente)
- ✅ Estadísticas y métricas
- ✅ Metadatos (fechas, técnico, etc.)

## 🔒 Seguridad

- Las credenciales se almacenan **solo en el código** (no en localStorage)
- Las fotos se comprimen antes de subir (reduce tamaño ~70%)
- Las comunicaciones usan **HTTPS**
- Las API Keys deben mantenerse **privadas**

## 📝 Notas Adicionales

1. **Reintentos automáticos:** Si falla una sincronización, se reintenta hasta 3 veces
2. **Cola de pendientes:** Las inspecciones no sincronizadas se guardan en cola
3. **Background Sync:** Con PWA instalada, se sincroniza en segundo plano
4. **Notificaciones:** Toast notifications informan del estado de sincronización

## 🆘 Soporte

Si necesitas ayuda:
1. Revisa los logs en la consola del navegador (F12)
2. Verifica la configuración de AppSheet
3. Comprueba los permisos de Google Drive
4. Consulta la [documentación de AppSheet API](https://support.google.com/appsheet/answer/10105769)

---

**Versión:** 1.0.0
**Última actualización:** Diciembre 2025
