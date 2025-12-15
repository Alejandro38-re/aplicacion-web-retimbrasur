# ⚡ AppSheet - Guía Rápida (5 minutos)

## 🎯 Objetivo
Crear un botón en AppSheet que abra la app web con todos los datos pre-cargados.

---

## 📝 PASO 1: Crear Columna Virtual URL

**Data → Columns → + New Column**

```
Nombre: URL_MantenimientoApp
Type: URL
App Formula: ✅ YES
Show?: ❌ NO
Formula: (pega abajo)
```

**FORMULA:**
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

Haz clic **"Done"** y **"Save"**

---

## 🔘 PASO 2: Crear Acción

**Behavior → Actions → + New Action**

```
Action name: Comenzar Mantenimiento
For a record of table: MANTENIMIENTO
Do this: Link to URL
Link: [URL_MantenimientoApp]  ← Selecciona de la lista, NO pegues
Prominence: Primary
```

Haz clic **"Done"** y **"Save"**

---

## 👁️ PASO 3: Agregar Botón a Vista

**UX → Views → MANTENIMIENTO_Detail**

```
Row selected action: Comenzar Mantenimiento
```

Haz **"Save & Verify"** y **"Deploy"**

---

## ✅ PASO 4: Probar

1. Abre la app en tu móvil/tablet
2. Sincroniza (pull down)
3. Abre un registro de MANTENIMIENTO
4. Haz clic en **"Comenzar Mantenimiento"**
5. Debe abrir el navegador con la app web y datos cargados

---

## ❌ ¿VES PLACEHOLDERS?

Si ves `[_THISROW].[CENTRO]` en lugar de valores:

👉 **[CONSULTA APPSHEET_FIX_PLACEHOLDERS.md](./APPSHEET_FIX_PLACEHOLDERS.md)**

---

## 🔄 Cambiar a Hostinger

Cuando subas la app a Hostinger:

1. Ve a **Data → Columns → URL_MantenimientoApp**
2. En Formula, **reemplaza solo la URL base:**
   - De: `https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html`
   - A: `https://retimbrasur.com/index.html`
3. **Save & Verify** y **Deploy**

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| Veo `[_THISROW].[CAMPO]` | No creaste la columna virtual. Lee APPSHEET_FIX_PLACEHOLDERS.md |
| "Column not found" | Revisa nombres de campos (MAYÚSCULAS, tildes, espacios) |
| Campos vacíos en la app | Los datos están vacíos en AppSheet también |
| AppSheet no se actualiza al finalizar | Verifica que `rowNumber` se envía correctamente |
| El botón no aparece | Verifica que agregaste la acción en UX → Views |

---

**¡Listo! 🎉**

La integración AppSheet ↔ Web App está completa.

*Para guía completa, consulta APPSHEET_SETUP.md*
