# 🔗 Guía de Configuración AppSheet - RETIMBRASUR

## ⚠️ ¿VES PLACEHOLDERS COMO `[_THISROW].[CENTRO]`?

**Si al abrir la app desde AppSheet ves textos como `[_THISROW].[Campo]` en lugar de los valores reales:**

👉 **[CONSULTA APPSHEET_FIX_PLACEHOLDERS.md](./APPSHEET_FIX_PLACEHOLDERS.md)** 👈

Ese archivo tiene todas las soluciones paso a paso para este problema común.

---

## 📋 Resumen

Esta guía te ayudará a configurar el botón "Comenzar Mantenimiento" en AppSheet para que abra la aplicación web de inspección con todos los datos pre-cargados.

**Versión de la App:** v2.2.1
**Última actualización:** 15 de Diciembre de 2024

---

## 🎯 Objetivo

Crear un botón en la tabla **MANTENIMIENTO** de AppSheet que:
1. Abra la web app de inspección
2. Pre-cargue automáticamente todos los datos del mantenimiento
3. Permita al técnico completar la inspección
4. Envíe los datos de vuelta a AppSheet al finalizar

---

## 📍 Paso 1: Elegir la URL Base

### Opción A: GitHub Pages (Para Probar AHORA) ✅

**URL actual de GitHub Pages:**
```
https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html
```

**Ventajas:**
- ✅ Disponible AHORA mismo
- ✅ Puedes probar la configuración inmediatamente
- ✅ No requiere ningún setup adicional
- ✅ Gratis

**Desventajas:**
- ⚠️ URL larga y difícil de recordar
- ⚠️ No es tu dominio personalizado
- ⚠️ Necesitarás cambiarla más tarde

### Opción B: Hostinger (Para Producción) 🚀

**URL futura en Hostinger:**
```
https://retimbrasur.com/index.html
```

**Ventajas:**
- ✅ URL corta y profesional
- ✅ Tu propio dominio
- ✅ SSL incluido
- ✅ Mejor para producción

**Desventajas:**
- ⏳ Requiere subir archivos a Hostinger primero
- ⏳ Configurar SSL/HTTPS
- ⏳ Seguir guía HOSTINGER_SETUP.md

---

## 🔧 Paso 2: Configurar el Botón en AppSheet

### 2.1. Crear Columna Virtual para la URL ⭐ IMPORTANTE

**¿Por qué?** AppSheet no reemplaza `[_THISROW]` directamente en URLs. Necesitas crear una columna que genere la URL dinámicamente.

1. Abre tu app en AppSheet Editor
2. Ve a **Data** → **Columns**
3. Haz clic en **"+ New Column"** (o "+ Column" arriba a la derecha)
4. Configura la nueva columna así:

**Configuración de la Columna:**
```
Column Name: URL_MantenimientoApp
Type: URL
App Formula: YES (marca el checkbox)
Formula: (pega la expresión CONCATENATE de abajo)
Show?: NO (desmarca - no necesitas verla en la app)
Editable?: NO (desmarca)
```

**EXPRESIÓN PARA EL CAMPO FORMULA (GitHub Pages - para probar AHORA):**

```
CONCATENATE(
  "https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
  "?centro=", ENCODEURL([CENTRO]),
  "&contacto=", ENCODEURL(TEXT([CONTACTO])),
  "&telefono=", IF(ISBLANK([TELEFONO]), "", [TELEFONO]),
  "&email=", IF(ISBLANK([EMAIL]), "", ENCODEURL([EMAIL])),
  "&mant=", [MANT],
  "&importe=", IF(ISBLANK([IMPORTE]), "", TEXT([IMPORTE])),
  "&fecha=", TEXT([FECHA]),
  "&proximoMantenimiento=", TEXT([PRÓXIMO MANTENIMIENTO]),
  "&pagoEfectivo=", [PAGO EFECTIVO],
  "&observaciones=", IF(ISBLANK([OBSERVACIONES]), "", ENCODEURL([OBSERVACIONES])),
  "&progreso=", IF(ISBLANK([PROGRESO]), "", ENCODEURL(TEXT([PROGRESO]))),
  "&rowNumber=", TEXT([_RowNumber]),
  "&appsheetMode=true"
)
```

**EXPRESIÓN PARA HOSTINGER (cuando estés listo para producción):**

```
CONCATENATE(
  "https://retimbrasur.com/index.html",
  "?centro=", ENCODEURL([CENTRO]),
  "&contacto=", ENCODEURL(TEXT([CONTACTO])),
  "&telefono=", IF(ISBLANK([TELEFONO]), "", [TELEFONO]),
  "&email=", IF(ISBLANK([EMAIL]), "", ENCODEURL([EMAIL])),
  "&mant=", [MANT],
  "&importe=", IF(ISBLANK([IMPORTE]), "", TEXT([IMPORTE])),
  "&fecha=", TEXT([FECHA]),
  "&proximoMantenimiento=", TEXT([PRÓXIMO MANTENIMIENTO]),
  "&pagoEfectivo=", [PAGO EFECTIVO],
  "&observaciones=", IF(ISBLANK([OBSERVACIONES]), "", ENCODEURL([OBSERVACIONES])),
  "&progreso=", IF(ISBLANK([PROGRESO]), "", ENCODEURL(TEXT([PROGRESO]))),
  "&rowNumber=", TEXT([_RowNumber]),
  "&appsheetMode=true"
)
```

5. Haz clic en **"Done"** para guardar la columna
6. Haz clic en **"Save"** arriba a la derecha para guardar la app

**⚠️ NOTAS IMPORTANTES:**
- Si CONTACTO es una referencia (Ref), usa `TEXT([CONTACTO])` para obtener el ID o `[CONTACTO].[Label]` para el nombre
- Los campos con `IF(ISBLANK())` evitan errores si el campo está vacío
- `ENCODEURL()` codifica espacios y caracteres especiales correctamente
- `TEXT()` convierte números y fechas a texto para la URL

### 2.2. Crear la Acción que Usa la Columna Virtual

1. Ve a **Behavior** → **Actions**
2. Haz clic en **"+ New Action"**
3. Configura así:

**Configuración de la Acción:**
```
Action name: Comenzar Mantenimiento
For a record of table: MANTENIMIENTO
Do this: Link to URL
Link: [URL_MantenimientoApp]
```

**⚠️ IMPORTANTE:** En el campo "Link", **NO PEGUES TEXTO**. En su lugar:
- Haz clic en el campo "Link"
- Aparecerá un dropdown con las columnas disponibles
- **Selecciona: URL_MantenimientoApp** de la lista
- Debería quedar: `[URL_MantenimientoApp]` (solo el nombre de la columna entre corchetes)

4. Haz clic en **"Done"**

### 2.3. Configuración Adicional de la Acción

**Prominence:** `Primary` (para que sea visible y destacado)

**Icon:** `📋` o `▶️` (puedes elegir el que prefieras)

**Display Name:** `Comenzar Mantenimiento`

**Description:** `Abrir aplicación web de inspección con datos pre-cargados`

**Behavior:**
- ✅ Show if: `TRUE` (o una condición si solo quieres mostrarlo en ciertos casos)
- ✅ Needs confirmation: `No`
- ✅ Open in new window: `Yes` (recomendado)

5. Haz clic en **"Done"**
6. Haz clic en **"Save"** para guardar

### 2.4. Agregar el Botón a la Vista

1. Ve a **UX** → **Views**
2. Busca la vista donde quieres el botón (ejemplo: **"MANTENIMIENTO_Detail"** o la vista de detalle)
3. Haz clic en la vista para editarla
4. En **View Options**, busca **"Row selected action"** o **"Actions"**
5. Agrega o selecciona la acción **"Comenzar Mantenimiento"**
6. **Guarda** la vista

**Alternativa - Agregar como botón flotante:**
1. En la misma vista, busca **"Display"** → **"Quick edit"** o **"Overlay actions"**
2. Marca **"Comenzar Mantenimiento"** para que aparezca como botón
3. **Guarda**

7. Haz **"Save & Verify"** arriba a la derecha
8. Haz **"Deploy"** o **"Go Live"** para publicar los cambios

---

## 📊 Paso 3: Mapeo de Campos

### Tabla de Referencia: Campos AppSheet → Parámetros URL

| Campo en AppSheet | Parámetro URL | Ejemplo de Valor | Obligatorio |
|---|---|---|---|
| **ID_Cliente** | `clientId` | `CLI-001` | No |
| **Nombre_Cliente** | `clientName` | `Empresa ABC S.L.` | No |
| **ID_Centro** | `workCenterId` | `CENTRO-001` | No |
| **Nombre_Centro** | `workCenterName` | `Nave Principal Madrid` | No |
| **CENTRO** | `centro` | `Nave Principal Madrid` | ⭐ Sí |
| **FECHA** | `fecha` | `2024-12-15` | ⭐ Sí |
| **PRÓXIMO MANTENIMIENTO** | `proximoMantenimiento` | `2025-06-15` | ⭐ Sí |
| **MANT** | `mant` | `SEMESTRAL` | ⭐ Sí |
| **CONTACTO** | `contacto` | `Juan Pérez` | No |
| **TELEFONO** | `telefono` | `666123456` | No |
| **EMAIL** | `email` | `juan@empresa.com` | No |
| **IMPORTE** | `importe` | `150,00` | No |
| **PAGO EFECTIVO** | `pagoEfectivo` | `Sí` o `No` | No |
| **OBSERVACIONES** | `observaciones` | `Cliente recurrente...` | No |
| **PROGRESO** | `progreso` | `PENDIENTE` | No |
| **_RowNumber** | `rowNumber` | `5` | ⭐ Sí (para actualizar) |
| **Nombre_Tecnico** | `technicianName` | `Carlos Técnico` | No |

**Notas:**
- ⭐ **Obligatorios:** Necesarios para sincronización correcta
- Los demás campos mejoran la experiencia pero son opcionales

---

## 🧪 Paso 4: Probar la Configuración

### 4.1. Prueba Manual con URL

Antes de probar desde AppSheet, verifica que la URL funcione manualmente:

**URL de Prueba (copia y pega en tu navegador):**

```
https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html?centro=Nave%20Principal&fecha=2024-12-15&proximoMantenimiento=2025-06-15&mant=SEMESTRAL&contacto=Juan%20Pérez&telefono=666123456&email=juan@empresa.com&importe=150,00&pagoEfectivo=Sí&observaciones=Cliente%20con%20problemas%20recurrentes&rowNumber=1&appsheetMode=true
```

**✅ Deberías Ver:**
1. La aplicación se abre
2. Al hacer clic en cualquier equipo para inspeccionar, aparecen 2 cards:
   - **Card de Contacto:** Con nombre, teléfono (clickeable) y email (clickeable)
   - **Card de Mantenimiento:** Con importe, badge de pago efectivo, tipo, fechas
3. El campo "Observaciones" está pre-llenado con las observaciones previas
4. El badge "PAGO EN EFECTIVO" parpadea en ROJO si es "Sí"

### 4.2. Prueba desde AppSheet

1. **Guarda** la acción en AppSheet
2. **Deploy** la app (botón "Save" → "Test")
3. Abre la app en tu móvil/tablet
4. Ve a un registro de la tabla MANTENIMIENTO
5. **Haz clic** en el botón "Comenzar Mantenimiento"
6. **Verifica** que se abra la web app con los datos correctos

---

## 🔄 Paso 5: Flujo Completo de Datos

### Flujo de Ida (AppSheet → Web App)

```
1. Usuario hace clic en "Comenzar Mantenimiento" en AppSheet
   ↓
2. AppSheet abre la URL con todos los parámetros
   ↓
3. Web app recibe los datos:
   - Contacto, teléfono, email
   - Importe y pago efectivo
   - Fechas de mantenimiento
   - Observaciones previas
   ↓
4. Web app muestra:
   - Cards de información
   - Campos pre-llenados
   - Badge de pago efectivo (si aplica)
   ↓
5. Técnico completa la inspección
```

### Flujo de Vuelta (Web App → AppSheet)

```
1. Técnico completa la inspección y hace clic en "Finalizar"
   ↓
2. Web app genera payload con:
   - fecha: Nueva fecha de inspección
   - proximoMantenimiento: Nueva fecha calculada
   - progreso: "COMPLETADO"
   - Resultados de la inspección (Conforme/Advertencia/No Conforme)
   ↓
3. Web app envía datos a returnUrl (AppSheet)
   ↓
4. AppSheet recibe los datos y actualiza la fila usando rowNumber
   ↓
5. Campos actualizados en AppSheet:
   - FECHA → Fecha actual
   - PRÓXIMO MANTENIMIENTO → Recalculado
   - PROGRESO → "COMPLETADO"
```

---

## 🔐 Paso 6: Seguridad y Consideraciones

### 6.1. Datos Sensibles

- ⚠️ **Teléfono y Email:** Son datos sensibles, la URL los expone
- ✅ **Solución:** Solo compartir con técnicos autorizados
- ✅ **Alternativa:** Usar HTTPS siempre (GitHub Pages y Hostinger lo tienen)

### 6.2. Validación de Datos

La web app valida:
- ✅ Formato de fechas (YYYY-MM-DD)
- ✅ Tipos de mantenimiento (TRIMESTRAL, SEMESTRAL, ANUAL)
- ✅ Valores de pago efectivo (Sí/No/Yes/Si/TRUE/1)

Si algún dato viene mal formateado, la app usa valores por defecto:
- Tipo de mantenimiento: `SEMESTRAL`
- Pago efectivo: `No`
- Observaciones: Vacío

---

## 🎨 Paso 7: Personalización Visual

### 7.1. Qué Verá el Técnico

**En Tablets (>1024px):**
- Cards grandes en 2 columnas
- Botones de 56px de altura
- Checkboxes de 32px
- Importe grande y destacado

**En Móviles (<768px):**
- Cards en 1 columna (vertical)
- Botones de ancho completo
- Todo optimizado para dedos

### 7.2. Badge de Pago Efectivo

**Si "PAGO EFECTIVO" = Sí:**
```
┌─────────────────────────────────┐
│ 💵 PAGO EN EFECTIVO            │ ← Rojo, parpadeante
└─────────────────────────────────┘
```

**Si "PAGO EFECTIVO" = No:**
```
┌─────────────────────────────────┐
│ 💳 Pago NO en efectivo         │ ← Azul, estático
└─────────────────────────────────┘
```

---

## 🔄 Paso 8: Cambiar de GitHub Pages a Hostinger

Cuando subas la app a Hostinger, solo necesitas:

### 8.1. En AppSheet

1. Ve a la acción "Comenzar Mantenimiento"
2. **Reemplaza** la URL base:
   - **De:** `https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html`
   - **A:** `https://retimbrasur.com/index.html`
3. **Guarda** y **Deploy**

### 8.2. El Resto de Parámetros

Los parámetros URL son EXACTAMENTE IGUALES, solo cambia la base:

```
?clientId=[_THISROW].[ID_Cliente]&clientName=...
```

Todo lo demás funciona igual.

---

## ✅ Checklist de Verificación

Antes de dar por completada la configuración, verifica:

### En AppSheet:
- [ ] Botón "Comenzar Mantenimiento" creado
- [ ] URL configurada con TODOS los parámetros
- [ ] Botón visible en la vista correcta
- [ ] Botón abre en nueva ventana/pestaña
- [ ] App guardada y deployed

### En la Web App:
- [ ] Se muestran las 2 cards de información
- [ ] Botón de teléfono abre marcador
- [ ] Botón de email abre cliente de correo
- [ ] Badge de pago efectivo parpadea si es "Sí"
- [ ] Importe se muestra grande y naranja
- [ ] Observaciones están pre-llenadas
- [ ] Al finalizar, se envía `progreso=COMPLETADO`

### Pruebas:
- [ ] Prueba manual con URL directa
- [ ] Prueba desde AppSheet en móvil
- [ ] Prueba completar una inspección
- [ ] Verifica que AppSheet se actualice

---

## 🆘 Solución de Problemas

### Problema 1: Las cards no aparecen

**Posibles causas:**
- Los parámetros URL no están llegando correctamente
- Nombres de campos mal escritos en AppSheet

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca `appSheetData` en la consola
3. Verifica que los campos tengan valores

### Problema 2: Badge de pago efectivo no parpadea

**Causa:** El valor de `pagoEfectivo` no es "Sí"

**Valores aceptados:**
- ✅ `Sí`, `SI`, `si`, `Yes`, `YES`, `yes`, `TRUE`, `true`, `1`
- ❌ `Si` (sin tilde) → Se considera NO
- ❌ `S`, `Y` → Se considera NO

**Solución:** Asegúrate de que AppSheet envía exactamente "Sí" o "Yes"

### Problema 3: Observaciones no se pre-llenan

**Causa:** El parámetro `observaciones` viene vacío o no se envía

**Solución:**
1. Verifica que el campo OBSERVACIONES tiene datos en AppSheet
2. Verifica que el parámetro URL incluye `observaciones=[_THISROW].[OBSERVACIONES]`
3. Si el campo está vacío, es normal que no aparezca nada

### Problema 4: AppSheet no se actualiza al finalizar

**Causa:** El `returnUrl` no está configurado o es incorrecto

**Solución:**
1. Verifica que la URL incluye: `returnUrl=https://www.appsheet.com/redirect`
2. Asegúrate de que AppSheet acepta POST requests en ese endpoint
3. Revisa los logs de AppSheet para ver si recibió los datos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Prueba con la URL manual primero
3. Verifica la consola del navegador (F12)
4. Comprueba que todos los campos existen en AppSheet

---

## 📝 Notas Finales

### URLs Útiles:
- **GitHub Pages (actual):** https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html
- **Hostinger (futura):** https://retimbrasur.com/index.html
- **AppSheet Redirect:** https://www.appsheet.com/redirect

### Próximos Pasos:
1. ✅ Configurar botón en AppSheet (puedes hacerlo AHORA con GitHub Pages)
2. ✅ Probar con datos reales
3. ⏳ Cuando estés listo, subir a Hostinger
4. ⏳ Cambiar URL en AppSheet a retimbrasur.com
5. ✅ Probar nuevamente y ¡listo!

---

**¡Configuración completada! 🎉**

La integración entre AppSheet y la web app está lista. Los técnicos ahora pueden:
- 📱 Hacer clic en un botón en AppSheet
- 🚀 Abrir la web app con todos los datos
- 📝 Completar la inspección fácilmente
- ↔️ Sincronizar automáticamente con AppSheet

---

*Versión: v2.2.1*
*Última actualización: 15/12/2024*
