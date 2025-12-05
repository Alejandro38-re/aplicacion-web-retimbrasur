# 🌐 Guía de Configuración en Hostinger

Esta guía explica paso a paso cómo subir la aplicación RETIMBRASUR a tu servidor Hostinger con el dominio **retimbrasur.com**.

---

## 📋 Requisitos Previos

- ✅ Cuenta de Hostinger activa
- ✅ Dominio **retimbrasur.com** configurado
- ✅ Acceso al panel de control de Hostinger
- ✅ Todos los archivos de la aplicación descargados

---

## 🚀 Paso 1: Preparar los Archivos

### Archivos a Subir

Necesitas subir TODOS los archivos de la carpeta `aplicacion informes/`:

```
📁 Archivos obligatorios:
├── index.html          ← Página principal
├── app.js              ← Lógica de la aplicación
├── styles.css          ← Estilos
├── manifest.json       ← Configuración PWA
├── service-worker.js   ← Cache offline
├── icon-192.png        ← Icono app (192x192)
├── icon-512.png        ← Icono app (512x512)
└── Logo sin fondo.png  ← Logo de RETIMBRASUR

📁 Archivos opcionales (documentación):
├── APPSHEET_CONFIG.md  ← Guía de integración AppSheet
├── MEJORAS_FUTURAS.md  ← Mejoras pendientes
└── HOSTINGER_SETUP.md  ← Este documento
```

### ⚠️ Importante

- **NO subir:** archivos `.md` si quieres mantenerlos privados
- **NO subir:** carpeta `.git` (si existe)
- **SÍ subir:** todos los archivos `.html`, `.js`, `.css`, `.json`, `.png`

---

## 🔧 Paso 2: Subir Archivos a Hostinger

### Opción A: Panel Web de Hostinger (Recomendado para principiantes)

1. **Accede a Hostinger**
   - Ve a: https://hpanel.hostinger.com/
   - Inicia sesión con tu cuenta

2. **Abre el Administrador de Archivos**
   - En el panel principal, busca **Archivos**
   - Haz clic en **Administrador de archivos**

3. **Navega a la Carpeta Pública**
   - En el explorador, ve a: `/public_html/`
   - Esta es la carpeta raíz de tu dominio

4. **Sube los Archivos**
   - Haz clic en **Subir archivos** (botón arriba a la derecha)
   - Selecciona TODOS los archivos de `aplicacion informes/`
   - Espera a que termine la carga (verás una barra de progreso)

5. **Verificar la Estructura**

   Tu carpeta `/public_html/` debería verse así:
   ```
   /public_html/
   ├── index.html
   ├── app.js
   ├── styles.css
   ├── manifest.json
   ├── service-worker.js
   ├── icon-192.png
   ├── icon-512.png
   └── Logo sin fondo.png
   ```

### Opción B: FTP con FileZilla (Recomendado para usuarios avanzados)

1. **Descarga FileZilla**
   - Ve a: https://filezilla-project.org/
   - Descarga e instala FileZilla Client

2. **Obtén Credenciales FTP**
   - En Hostinger, ve a **Archivos** → **FTP Accounts**
   - Anota:
     - **Host/Servidor:** ftp.retimbrasur.com
     - **Usuario:** tu_usuario@retimbrasur.com
     - **Contraseña:** [tu contraseña]
     - **Puerto:** 21

3. **Conéctate con FileZilla**
   - Abre FileZilla
   - En la barra superior, completa:
     - Servidor: `ftp.retimbrasur.com`
     - Usuario: `tu_usuario@retimbrasur.com`
     - Contraseña: [tu contraseña]
     - Puerto: `21`
   - Haz clic en **Conexión rápida**

4. **Sube los Archivos**
   - Panel izquierdo: Navega a tu carpeta `aplicacion informes/` local
   - Panel derecho: Navega a `/public_html/` en el servidor
   - Arrastra todos los archivos del izquierdo al derecho
   - Espera a que termine la transferencia

---

## 🔒 Paso 3: Activar HTTPS (SSL)

### ⚠️ Crucial para que funcionen:
- Dictado por voz
- Geolocalización
- Cámara
- Service Worker (modo offline)

### Activar Let's Encrypt SSL (Gratis)

1. **Accede al Panel de Hostinger**
   - Ve a: https://hpanel.hostinger.com/

2. **Configura SSL**
   - En el menú lateral, busca **SSL**
   - Selecciona tu dominio: **retimbrasur.com**
   - Haz clic en **Instalar SSL**

3. **Selecciona Let's Encrypt**
   - Marca la opción **Let's Encrypt SSL** (gratis)
   - Haz clic en **Instalar**

4. **Espera la Activación**
   - El proceso tarda entre **5-15 minutos**
   - Recibirás un email cuando esté listo
   - Verás un candado verde 🔒 en la URL

5. **Forzar HTTPS (Opcional pero Recomendado)**
   - Ve a **Hosting** → **Configuración avanzada**
   - Busca **Forzar HTTPS**
   - Actívalo
   - Esto redirige automáticamente `http://` a `https://`

---

## 📱 Paso 4: Configurar la Aplicación

### Actualizar Service Worker

Edita el archivo `service-worker.js` (línea 1):

**Antes:**
```javascript
const CACHE_NAME = 'retimbrasur-v2.0.4';
```

**Después (opcional - cambiar versión):**
```javascript
const CACHE_NAME = 'retimbrasur-v2.0.4-hostinger';
```

### Actualizar Manifest (Opcional)

Si quieres ajustar los colores o nombre, edita `manifest.json`:

```json
{
  "name": "RETIMBRASUR - Sistema de Inspección PCI",
  "short_name": "RETIMBRASUR",
  "start_url": "/index.html",
  "scope": "/",
  "display": "standalone",
  "background_color": "#d32f2f",
  "theme_color": "#d32f2f",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔗 Paso 5: Configurar AppSheet

### URL del Botón "Comenzar Mantenimiento"

En tu aplicación AppSheet, configura el botón de acción con esta URL:

```
https://retimbrasur.com/index.html?clientId=[_THISROW].[ID_Cliente]&clientName=[_THISROW].[Nombre_Cliente]&clientAddress=[_THISROW].[Direccion]&clientPhone=[_THISROW].[Telefono]&workCenterId=[_THISROW].[ID_Centro]&workCenterName=[_THISROW].[Nombre_Centro]&workCenterAddress=[_THISROW].[Direccion_Centro]&technicianId=[_THISROW].[ID_Tecnico]&technicianName=[_THISROW].[Nombre_Tecnico]&appsheetMode=true
```

### Reemplaza los Campos

Cambia `[_THISROW].[Nombre_Campo]` por los nombres reales de tus columnas en AppSheet.

**Ejemplo:**
```
https://retimbrasur.com/index.html?clientName=[_THISROW].[Cliente]&workCenterName=[_THISROW].[Centro_Trabajo]&technicianName=[_THISROW].[Tecnico]&appsheetMode=true
```

### Configuración del Botón en AppSheet

1. **Ve a tu tabla de Centros/Órdenes de Trabajo**
2. **Añade una nueva acción (Action)**
   - Nombre: `🔥 Comenzar Mantenimiento`
   - For a record of this table: `Sí`
   - Do this: `App: go to another app within a device`
   - Target: `Link to external app or website`
3. **Pega la URL configurada arriba**
4. **Guarda**

---

## ✅ Paso 6: Verificar la Instalación

### Checklist de Verificación

- [ ] **Acceso Web**
  - Visita: `https://retimbrasur.com`
  - Deberías ver la aplicación cargada
  - Verifica el badge de versión: **v2.0.4**

- [ ] **HTTPS Activo**
  - Verifica el candado 🔒 verde en el navegador
  - La URL debe empezar con `https://` (no `http://`)

- [ ] **Service Worker**
  - Abre la consola del navegador (F12)
  - Ve a **Application** → **Service Workers**
  - Deberías ver `service-worker.js` activo

- [ ] **Modo Offline**
  - Abre la aplicación
  - Activa el modo avión
  - Recarga la página (F5)
  - La app debería seguir funcionando

- [ ] **Integración AppSheet**
  - Desde AppSheet, haz clic en "🔥 Comenzar Mantenimiento"
  - Deberías ver la app con datos pre-cargados
  - Verifica en consola (F12) el mensaje: `📱 AppSheet Mode: Data pre-loaded`

- [ ] **Funciones Especiales**
  - 📸 Tomar foto con cámara
  - 🎤 Dictado por voz
  - 📍 Geolocalización
  - ✍️ Firmas digitales

---

## 🐛 Solución de Problemas

### ❌ Error 404 - Página no encontrada

**Causa:** Archivos no subidos correctamente
**Solución:**
1. Verifica que `index.html` esté en `/public_html/`
2. Revisa que el nombre del archivo sea exactamente `index.html` (minúsculas)
3. Limpia la caché del navegador (Ctrl + Shift + R)

### ❌ Estilos no cargan (página sin formato)

**Causa:** Archivo `styles.css` no encontrado
**Solución:**
1. Verifica que `styles.css` esté en la misma carpeta que `index.html`
2. Abre la consola (F12) y busca errores 404
3. Sube de nuevo el archivo `styles.css`

### ❌ Aplicación no funciona

**Causa:** Falta archivo `app.js`
**Solución:**
1. Verifica que `app.js` esté subido
2. Abre consola (F12) → pestaña **Console** y busca errores
3. Asegúrate de que el archivo no se corrompió durante la carga

### ❌ Certificado SSL no activa

**Causa:** Demora en propagación DNS
**Solución:**
1. Espera 24 horas para propagación completa
2. Limpia caché DNS: `ipconfig /flushdns` (Windows) o `sudo dscacheutil -flushcache` (Mac)
3. Contacta soporte de Hostinger si persiste

### ❌ Service Worker no funciona

**Causa:** HTTPS no está activo
**Solución:**
1. Verifica que la URL sea `https://` (con 's')
2. Activa SSL siguiendo el **Paso 3**
3. Limpia caché y recarga (Ctrl + Shift + R)

### ❌ Dictado por voz no funciona

**Causa:** Falta HTTPS o navegador no compatible
**Solución:**
1. Asegúrate de usar `https://`
2. Usa Chrome o Edge (navegadores compatibles)
3. Da permisos de micrófono cuando lo solicite

### ❌ Datos de AppSheet no llegan

**Causa:** URL mal formada o campos incorrectos
**Solución:**
1. Revisa la URL del botón en AppSheet
2. Verifica que los nombres de campos coincidan: `[_THISROW].[TuCampo]`
3. Abre consola (F12) y busca los parámetros URL

---

## 🎯 Mejoras Opcionales

### Configurar Subdominio (app.retimbrasur.com)

Si prefieres tener la app en un subdominio:

1. En Hostinger, ve a **Dominios** → **Subdominios**
2. Crea: `app.retimbrasur.com`
3. Sube los archivos a `/public_html/app/`
4. Tu URL será: `https://app.retimbrasur.com`

### Configurar Email Profesional

Aprovecha tu dominio para emails:

1. En Hostinger, ve a **Emails**
2. Crea: `info@retimbrasur.com` o `inspecciones@retimbrasur.com`
3. Configura en tu móvil o cliente de correo

### Backup Automático

Activa copias de seguridad:

1. En Hostinger, ve a **Backups**
2. Activa **Backups automáticos**
3. Frecuencia recomendada: **Semanal**

### Monitoreo de Uptime

Configura alertas si la página cae:

1. Usa un servicio gratuito: https://uptimerobot.com/
2. Añade tu URL: `https://retimbrasur.com`
3. Recibirás emails si hay caídas

---

## 📊 Estadísticas (Google Analytics - Opcional)

Si quieres ver cuántos técnicos usan la app:

1. **Crea una cuenta en Google Analytics**
   - Ve a: https://analytics.google.com/
   - Crea una propiedad para `retimbrasur.com`

2. **Obtén el código de seguimiento**
   - Copia el código `G-XXXXXXXXXX`

3. **Agrégalo a index.html**

   Antes de `</head>`, añade:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

4. **Sube el archivo actualizado**

---

## 📞 Soporte y Recursos

### Documentación de Hostinger
- Panel de ayuda: https://support.hostinger.com/
- Chat en vivo: Disponible 24/7 en el panel

### Documentación de la Aplicación
- `APPSHEET_CONFIG.md` - Integración con AppSheet
- `MEJORAS_FUTURAS.md` - Próximas funcionalidades

### Contacto Desarrollador
- Para actualizaciones o nuevas funcionalidades
- Mantén siempre la versión más reciente

---

## ✅ Lista de Verificación Final

Antes de dar por terminada la configuración:

- [ ] ✅ Archivos subidos correctamente a `/public_html/`
- [ ] ✅ HTTPS (SSL) activado y funcionando
- [ ] ✅ Página accesible desde `https://retimbrasur.com`
- [ ] ✅ Badge de versión visible: **v2.0.4**
- [ ] ✅ Service Worker registrado (modo offline funciona)
- [ ] ✅ Botón de AppSheet configurado
- [ ] ✅ Integración AppSheet probada (datos pre-cargados)
- [ ] ✅ Dictado por voz funcional
- [ ] ✅ Cámara/fotos funcionando
- [ ] ✅ Firmas digitales operativas
- [ ] ✅ Exportación a PDF funciona
- [ ] ✅ Texto del PDF visible (color oscuro)

---

## 🎉 ¡Listo!

Tu aplicación RETIMBRASUR está ahora en producción en:

**🔗 https://retimbrasur.com**

Los técnicos pueden acceder desde AppSheet haciendo clic en "🔥 Comenzar Mantenimiento" y trabajar con todos los datos sincronizados.

---

**Versión:** 1.0
**Fecha:** Diciembre 2025
**Aplicación:** RETIMBRASUR v2.0.4
