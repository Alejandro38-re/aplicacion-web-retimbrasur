# 🔧 SOLUCIÓN: Placeholders No Se Reemplazan en AppSheet

## ❌ PROBLEMA

Cuando abres la app desde AppSheet, ves literales como:
```
[_THISROW].[Nombre_Centro]
[_THISROW].[CONTACTO]
```

En lugar de los valores reales.

---

## ✅ SOLUCIONES (Prueba en este orden)

### SOLUCIÓN 1: Usar el Tipo de Acción Correcto ⭐ MÁS COMÚN

**El problema**: Estás usando "Link to URL" pero pegando la expresión directamente en lugar de seleccionar los campos.

**LA SOLUCIÓN CORRECTA:**

#### Paso 1: Crear Columna Virtual para la URL

1. En AppSheet Editor, ve a **Data** → **Columns**
2. Haz clic en **"+ New Column"**
3. Configura así:

```
Column Name: URL_MantenimientoApp
Type: URL
Formula: (pega la expresión CONCATENATE completa aquí)
```

**EXPRESIÓN A PEGAR EN FORMULA:**

```
CONCATENATE(
  "https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
  "?centro=", ENCODEURL([CENTRO]),
  "&contacto=", ENCODEURL([CONTACTO]),
  "&telefono=", [TELEFONO],
  "&email=", ENCODEURL([EMAIL]),
  "&mant=", [MANT],
  "&importe=", TEXT([IMPORTE]),
  "&fecha=", TEXT([FECHA]),
  "&proximoMantenimiento=", TEXT([PRÓXIMO MANTENIMIENTO]),
  "&pagoEfectivo=", [PAGO EFECTIVO],
  "&observaciones=", ENCODEURL([OBSERVACIONES]),
  "&progreso=", CONCATENATE([PROGRESO]),
  "&rowNumber=", TEXT([_RowNumber]),
  "&appsheetMode=true"
)
```

4. **IMPORTANTE**: Si CONTACTO es una referencia (Ref), usa:
```
"&contacto=", ENCODEURL(TEXT([CONTACTO])),
```

O si quieres el Label:
```
"&contacto=", ENCODEURL([CONTACTO].[Label]),
```

5. Marca como **"Show?"** = **NO** (para que no se vea en la app)
6. **Guarda**

#### Paso 2: Crear la Acción que Use Esta Columna

1. Ve a **Behavior** → **Actions**
2. Haz clic en **"+ New Action"**
3. Configura así:

```
Action name: Comenzar Mantenimiento
For a record of table: MANTENIMIENTO
Do this: App: go to another view within this app
Target: _self

En el campo "Link":
   Selecciona de la lista: URL_MantenimientoApp

   NO PEGUES NADA A MANO AQUÍ - Solo selecciona el campo de la lista
```

4. **Prominence**: Primary
5. **Display name**: "Comenzar Mantenimiento"
6. **Guarda**

#### Paso 3: Agregar el Botón a la Vista

1. Ve a **UX** → **Views**
2. Selecciona la vista donde quieres el botón (ej: "MANTENIMIENTO_Detail")
3. En **View Options** → **Row selected action**:
   - Selecciona: "Comenzar Mantenimiento"
4. **Guarda y Deploy**

---

### SOLUCIÓN 2: Si CONCATENATE da error por campo PROGRESO

**El problema**: PROGRESO es un EnumList, no se puede concatenar directamente.

**FIX:**

Reemplaza esta línea:
```javascript
"&progreso=", CONCATENATE([PROGRESO]),
```

Por esta:
```javascript
"&progreso=", ENCODEURL(TEXT([PROGRESO])),
```

O si solo quieres un valor:
```javascript
"&progreso=", INDEX(SPLIT([PROGRESO], ","), 1),
```

---

### SOLUCIÓN 3: Si el campo CONTACTO da error

**El problema**: CONTACTO es tipo Ref (referencia a otra tabla).

**OPCIONES:**

**Opción A - Usar el ID:**
```javascript
"&contacto=", [CONTACTO],
```

**Opción B - Usar el Label (nombre visible):**
```javascript
"&contacto=", ENCODEURL([CONTACTO].[Label]),
```

**Opción C - Usar un campo específico de la tabla referenciada:**
```javascript
"&contacto=", ENCODEURL([CONTACTO].[Nombre]),
```

---

### SOLUCIÓN 4: Expresión Simplificada (Para Probar)

Si nada funciona, usa esta expresión MÍNIMA para probar:

```
CONCATENATE(
  "https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
  "?centro=", [CENTRO],
  "&fecha=", TEXT([FECHA]),
  "&mant=", [MANT],
  "&appsheetMode=true"
)
```

Si esto funciona, ve agregando campos uno por uno hasta encontrar cuál causa el problema.

---

### SOLUCIÓN 5: Verificar Nombres de Campos EXACTOS

AppSheet es **case-sensitive** y requiere nombres EXACTOS.

**Verifica que tus campos se llamen EXACTAMENTE:**

```
[CENTRO]                    ✅ Correcto
[Centro]                    ❌ Incorrecto (minúscula)
[PRÓXIMO MANTENIMIENTO]     ✅ Correcto (con espacio)
[PROXIMO MANTENIMIENTO]     ❌ Incorrecto (sin tilde)
[PAGO EFECTIVO]             ✅ Correcto (con espacio)
[PAGO_EFECTIVO]             ❌ Incorrecto (con guion bajo)
```

**Cómo verificar nombres exactos:**
1. Ve a **Data** → **Columns**
2. Busca el campo
3. Copia el nombre EXACTO (con mayúsculas, tildes, espacios)
4. Pégalo en la expresión

---

### SOLUCIÓN 6: Limpiar Caché de AppSheet

A veces AppSheet cachea la configuración antigua:

1. En AppSheet Editor: **Guarda** (Save)
2. Haz clic en **"..."** (más opciones) → **"Regenerate Structure"**
3. Espera que termine
4. Haz **"Save & Verify"**
5. Haz **Deploy** nuevamente
6. En tu móvil/tablet:
   - Cierra la app completamente
   - Ábrela de nuevo
   - Sincroniza (pull down)
7. Prueba el botón

---

### SOLUCIÓN 7: Usar Acción Tipo "Link to URL" Directamente

Si las anteriores no funcionan:

1. **Behavior** → **Actions** → **"+ New Action"**
2. Configura:

```
Action name: Comenzar Mantenimiento
For a record of table: MANTENIMIENTO
Do this: Link to URL
Link: (pega aquí la expresión CONCATENATE completa)
```

**IMPORTANTE**: En el campo "Link", pega LA EXPRESIÓN, no el resultado. Por ejemplo:

```
CONCATENATE("https://...", "?centro=", [CENTRO], ...)
```

**NO PEGUES:**
```
https://...?centro=[_THISROW].[CENTRO]
```

---

## 🧪 PRUEBA PASO A PASO

### Test 1: Verificar que la expresión funciona

1. Ve a **Data** → **MANTENIMIENTO**
2. Selecciona UNA fila de prueba
3. En la vista de esa fila, debería aparecer la columna virtual URL_MantenimientoApp
4. **Copia esa URL generada**
5. Pégala en tu navegador
6. ¿Se ve bien? ✅ → La expresión funciona
7. ¿Sigues viendo placeholders? ❌ → La expresión tiene errores

### Test 2: Verificar qué campos fallan

Comenta campos uno por uno en la expresión:

**Versión 1 (solo 2 campos):**
```
CONCATENATE(
  "https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
  "?centro=", [CENTRO],
  "&mant=", [MANT]
)
```

**Si funciona, agrega más:**
```
CONCATENATE(
  "https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html",
  "?centro=", [CENTRO],
  "&mant=", [MANT],
  "&fecha=", TEXT([FECHA])
)
```

**Si falla, el último campo agregado es el problema.**

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Verifica cada punto:

### En AppSheet Editor:
- [ ] Creaste una columna virtual tipo URL con la expresión CONCATENATE
- [ ] La expresión NO tiene errores de sintaxis (AppSheet lo marca en rojo si hay error)
- [ ] Los nombres de campos coinciden EXACTAMENTE (mayúsculas, tildes, espacios)
- [ ] Guardaste la columna
- [ ] Creaste una acción que usa esa columna URL
- [ ] La acción es tipo "Link to URL" o "go to another view"
- [ ] Agregaste el botón a la vista correcta
- [ ] Hiciste "Save & Verify"
- [ ] Hiciste "Deploy"

### En la App (Móvil/Tablet):
- [ ] Cerraste y abriste la app
- [ ] Sincronizaste (pull down)
- [ ] El botón "Comenzar Mantenimiento" aparece
- [ ] Al hacer clic, se abre el navegador (no dentro de AppSheet)

### En el Navegador:
- [ ] La URL en la barra del navegador tiene valores reales (no placeholders)
- [ ] La app web se carga correctamente
- [ ] Los datos aparecen en las cards de información

---

## 🔍 DIAGNÓSTICO: ¿Qué Veo en la URL?

### ❌ INCORRECTO (Placeholders):
```
https://...?centro=[_THISROW].[CENTRO]&contacto=[_THISROW].[CONTACTO]
```

**Causa**: Estás usando un Action tipo "Link to URL" pero pegando texto plano con [_THISROW] en lugar de la expresión CONCATENATE.

**Fix**: Usa SOLUCIÓN 1 (columna virtual + acción).

---

### ❌ INCORRECTO (Campos vacíos):
```
https://...?centro=&contacto=&fecha=
```

**Causa**: La expresión se evaluó pero los campos están vacíos en AppSheet.

**Fix**: Verifica que la fila en AppSheet tenga datos en esos campos.

---

### ✅ CORRECTO:
```
https://...?centro=Nave%20Principal&contacto=Juan%20Perez&fecha=2024-12-15&mant=SEMESTRAL...
```

**Resultado**: Los valores están codificados correctamente (%20 = espacio).

---

## 🆘 SI NADA FUNCIONA

### Plan B: Usa Deep Link de AppSheet

En lugar de abrir la web externa, usa un deep link:

```
CONCATENATE(
  "appsheet://",
  "open?appName=TuApp&table=MANTENIMIENTO&row=",
  [_RowNumber]
)
```

Y configura la app web para recibir datos vía API en lugar de URL parameters.

### Plan C: Usa Google Apps Script como Proxy

1. Crea un Google Apps Script que reciba el ID de la fila
2. El script consulta AppSheet API para obtener los datos
3. Redirige a la web app con los datos

---

## 📞 VERIFICACIÓN FINAL

**Haz esto para confirmar que todo funciona:**

1. Abre AppSheet Editor
2. Ve a **Data** → **MANTENIMIENTO**
3. Busca la columna virtual **URL_MantenimientoApp**
4. Haz clic en una fila cualquiera
5. Mira el valor de URL_MantenimientoApp
6. **COPIA esa URL completa**
7. **Pégala en un navegador**

**Si ves placeholders en esa URL copiada**: La expresión CONCATENATE está mal.
**Si ves valores reales en esa URL copiada pero el botón no funciona**: La acción está mal configurada.

---

## ✅ EXPRESIÓN FINAL PROBADA

Copia exactamente esta (ajusta los nombres de campos si los tuyos son diferentes):

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

**Diferencias con la anterior:**
- ✅ Usa `TEXT()` para convertir referencias
- ✅ Usa `IF(ISBLANK())` para evitar errores en campos vacíos
- ✅ Usa `ENCODEURL()` en todos los campos de texto

---

**¡Con esto debería funcionar! Si sigues teniendo problemas, el issue está en la configuración de la acción, no en la expresión.**
