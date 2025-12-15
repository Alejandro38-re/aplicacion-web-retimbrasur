# 🌐 AppSheet - Configuración "Abrir Web Externa"

## ✅ Método Correcto para Abrir URL Externa

### PASO 1: Crear Columna Virtual (Igual que antes)

**Data → Columns → + New Column**

```
Column Name: URL_MantenimientoApp
Type: URL
App Formula: ✅ YES
Show?: ❌ NO
Editable?: ❌ NO
```

**Formula:**
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

**Guardar:** "Done" → "Save"

---

### PASO 2: Crear Acción "Link to URL" (Web Externa)

**Behavior → Actions → + New Action**

#### Configuración de la Acción:

```
Action name: Comenzar Mantenimiento
Display name: Comenzar Mantenimiento
For a record of table: MANTENIMIENTO

Do this: Link to URL  ← ⭐ ESTA ES LA OPCIÓN PARA WEB EXTERNA

Link: [URL_MantenimientoApp]  ← Selecciona de la lista desplegable
```

**⚠️ MUY IMPORTANTE:**
- En el campo **"Link"**, haz clic en el campo
- Aparecerá una lista desplegable con todas tus columnas
- **Selecciona: `URL_MantenimientoApp`**
- Debe quedar exactamente: `[URL_MantenimientoApp]`
- **NO PEGUES TEXTO A MANO**

#### Opciones Adicionales:

```
Prominence: Primary
Icon: 🌐 o 📱 (el que prefieras)
Display inline: NO (desmarca)
Needs confirmation: NO (desmarca)
```

**Guardar:** "Done" → "Save"

---

### PASO 3: Agregar Botón a la Vista

**UX → Views → MANTENIMIENTO_Detail** (o tu vista de detalle)

**En View Options:**
```
Row selected action: Comenzar Mantenimiento
```

**O agregar como acción disponible:**
```
Actions → + Add action → Comenzar Mantenimiento
```

**Guardar:** "Done" → "Save"

---

### PASO 4: Deploy

1. **"Save & Verify"** arriba a la derecha
2. Espera que termine la verificación
3. **"Deploy"** o **"Go Live"**
4. Espera la confirmación

---

### PASO 5: Probar en el Móvil/Tablet

1. Cierra la app AppSheet completamente (swipe up para cerrar)
2. Abre la app de nuevo
3. Sincroniza (pull down en la lista)
4. Abre un registro de MANTENIMIENTO
5. Verás el botón **"Comenzar Mantenimiento"**
6. Haz clic → debe abrir el navegador (Chrome/Safari)
7. La web app debe cargarse con todos los datos

---

## 🎯 Diferencias entre Tipos de Acción

| Tipo de Acción | Qué Hace | Cuándo Usar |
|----------------|----------|-------------|
| **Link to URL** | Abre URL en navegador externo | ✅ Para tu caso (web app externa) |
| App: go to another view | Abre vista dentro de AppSheet | ❌ Solo para vistas internas |
| Open a form | Abre formulario de AppSheet | ❌ Solo para editar datos |
| Execute an action | Ejecuta otra acción | ❌ Para cadenas de acciones |

**Para abrir una web externa siempre usa: `Link to URL`**

---

## ✅ Verificación: ¿Está Funcionando?

### ✅ Correcto:
1. Haces clic en "Comenzar Mantenimiento"
2. Se abre el navegador (Chrome/Safari/Firefox)
3. La URL en la barra del navegador muestra valores reales:
   ```
   https://alejandro38-re.github.io/...?centro=Nave%20Principal&contacto=Juan...
   ```
4. La app web carga con las cards de información
5. Los datos están pre-llenados

### ❌ Incorrecto - Ves placeholders:
```
https://...?centro=[_THISROW].[CENTRO]&contacto=[_THISROW].[CONTACTO]
```

**Causa:** No creaste la columna virtual, o pegaste texto en vez de seleccionar la columna.

**Solución:** Vuelve al PASO 1 y crea la columna virtual correctamente.

---

### ❌ Incorrecto - No abre el navegador:
**Causa:** Usaste "App: go to another view" en lugar de "Link to URL".

**Solución:**
1. Behavior → Actions → Comenzar Mantenimiento
2. Cambia "Do this" a: **"Link to URL"**
3. Save & Deploy

---

### ❌ Incorrecto - Error "Invalid URL":
**Causa:** Hay un error en la expresión CONCATENATE.

**Solución:**
1. Data → Columns → URL_MantenimientoApp
2. Verifica que la expresión no tenga errores de sintaxis
3. Prueba con una expresión simplificada:
   ```
   CONCATENATE(
     "https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
     "?centro=", [CENTRO],
     "&fecha=", TEXT([FECHA])
   )
   ```
4. Si funciona, agrega campos uno por uno

---

## 🔧 Troubleshooting Específico

### Problema 1: El botón no aparece

**Verifica:**
1. **UX → Views → MANTENIMIENTO_Detail**
2. ¿Agregaste la acción en "Row selected action" o "Actions"?
3. ¿Hiciste Deploy después de guardar?

**Fix:**
- UX → Views → tu vista → Row selected action → Comenzar Mantenimiento
- Save & Deploy

---

### Problema 2: Abre AppSheet en lugar del navegador

**Causa:** El tipo de acción está mal configurado.

**Fix:**
1. Behavior → Actions → Comenzar Mantenimiento
2. **"Do this"** debe ser exactamente: **"Link to URL"**
3. NO debe ser "App: go to another view"
4. Save & Deploy

---

### Problema 3: URL con caracteres raros (%20, %C3%B3, etc.)

**Esto es CORRECTO** ✅

Los caracteres como:
- `%20` = espacio
- `%C3%B3` = ó (letra o con tilde)
- `%40` = @

Son la codificación URL correcta (ENCODEURL). **No los cambies**.

---

### Problema 4: Campos vacíos en la web app

**Causa:** Los datos están vacíos en AppSheet.

**Verifica:**
1. Data → MANTENIMIENTO → Ver la fila de prueba
2. ¿Tienen valores los campos CENTRO, CONTACTO, TELEFONO, etc.?
3. Si están vacíos, agrégalos manualmente para probar

---

### Problema 5: CONTACTO no se ve

**Si CONTACTO es tipo Ref (referencia):**

Cambia esta línea en la expresión:
```javascript
"&contacto=", ENCODEURL(TEXT([CONTACTO])),
```

Por una de estas opciones:

**Opción A - Usar el Label:**
```javascript
"&contacto=", ENCODEURL([CONTACTO].[Label]),
```

**Opción B - Usar un campo específico:**
```javascript
"&contacto=", ENCODEURL([CONTACTO].[Nombre]),
```

Reemplaza `[Nombre]` por el nombre del campo que quieres mostrar de la tabla referenciada.

---

## 📱 Comportamiento Esperado

### En Android:
1. Clic en "Comenzar Mantenimiento"
2. Aparece un diálogo: "Abrir con Chrome / Firefox / Samsung Internet"
3. Seleccionas el navegador
4. Se abre la web app

### En iOS (iPhone/iPad):
1. Clic en "Comenzar Mantenimiento"
2. Se abre Safari automáticamente
3. Carga la web app

### En Ambos:
- La app AppSheet queda en segundo plano
- Puedes volver a AppSheet usando el botón "Atrás" o cambio de app
- Al finalizar la inspección, los datos se sincronizan de vuelta a AppSheet

---

## 🔄 Cuando Cambies a Hostinger

Solo tienes que cambiar la URL base en la columna virtual:

**Data → Columns → URL_MantenimientoApp → Formula**

Reemplaza:
```
"https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
```

Por:
```
"https://retimbrasur.com/index.html",
```

**Save & Verify → Deploy** → Listo ✅

---

## ✅ Checklist Final

- [ ] Columna `URL_MantenimientoApp` creada (tipo URL, con CONCATENATE)
- [ ] Acción "Comenzar Mantenimiento" creada con tipo **"Link to URL"**
- [ ] Campo "Link" de la acción contiene: `[URL_MantenimientoApp]`
- [ ] Acción agregada a la vista MANTENIMIENTO_Detail
- [ ] Save & Verify realizado sin errores
- [ ] Deploy completado
- [ ] App sincronizada en el móvil/tablet
- [ ] Botón "Comenzar Mantenimiento" visible
- [ ] Al hacer clic, abre el navegador (no dentro de AppSheet)
- [ ] URL muestra valores reales (no placeholders)
- [ ] Web app carga correctamente

---

**¡Listo!** Con estos pasos, la opción de "abrir web externa" funcionará perfectamente. 🌐✅
