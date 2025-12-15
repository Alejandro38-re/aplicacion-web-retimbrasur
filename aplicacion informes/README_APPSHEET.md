# 📚 Documentación AppSheet - RETIMBRASUR

## 🎯 ¿Qué guía necesitas?

### ⚡ [APPSHEET_QUICK_START.md](./APPSHEET_QUICK_START.md)
**Guía rápida de 5 minutos**
- Si quieres configurar AppSheet AHORA
- Pasos mínimos para que funcione
- Instrucciones concisas

👉 **EMPIEZA AQUÍ si es tu primera vez**

---

### 🌐 [APPSHEET_EXTERNAL_LINK.md](./APPSHEET_EXTERNAL_LINK.md)
**Configuración específica para "Abrir Web Externa"**
- Tipo de acción "Link to URL"
- Abre navegador externo (Chrome/Safari)
- Paso a paso con verificaciones

👉 **USA ESTA si quieres abrir el navegador externo**

---

### ❌ [APPSHEET_FIX_PLACEHOLDERS.md](./APPSHEET_FIX_PLACEHOLDERS.md)
**Solución para el problema de placeholders**
- Si ves `[_THISROW].[CENTRO]` en lugar de valores reales
- 7 soluciones diferentes
- Diagnóstico paso a paso

👉 **USA ESTA si tienes problemas con placeholders**

---

### 📖 [APPSHEET_SETUP.md](./APPSHEET_SETUP.md)
**Guía completa y detallada**
- Explicación paso a paso con detalles
- Mapeo completo de campos
- Flujo de datos bidireccional
- Personalización visual
- Troubleshooting completo

👉 **CONSULTA ESTA para entender todo el sistema**

---

## 🚀 Flujo Recomendado

### Primera Configuración (Abrir Web Externa):
1. Lee **APPSHEET_EXTERNAL_LINK.md** (configuración específica para navegador)
2. Crea columna virtual + acción tipo "Link to URL"
3. Prueba que abre en Chrome/Safari

**O usa:**
1. Lee **APPSHEET_QUICK_START.md** (5 min - más general)
2. Sigue los 4 pasos
3. Prueba el botón

### Si Tienes Problemas:
1. Consulta **APPSHEET_FIX_PLACEHOLDERS.md**
2. Prueba las 7 soluciones en orden
3. Usa el checklist de diagnóstico

### Para Entender Todo:
1. Lee **APPSHEET_SETUP.md** completo
2. Revisa el mapeo de campos
3. Entiende el flujo bidireccional

---

## 📋 Checklist General

### Configuración Básica:
- [ ] Columna virtual `URL_MantenimientoApp` creada
- [ ] Expresión CONCATENATE pegada en Formula
- [ ] Acción "Comenzar Mantenimiento" creada
- [ ] Botón agregado a la vista MANTENIMIENTO
- [ ] Save & Verify realizado
- [ ] Deploy completado

### Pruebas:
- [ ] Botón visible en la app móvil/tablet
- [ ] Al hacer clic, abre el navegador
- [ ] URL tiene valores reales (no placeholders)
- [ ] App web carga correctamente
- [ ] Cards de información aparecen
- [ ] Datos están pre-llenados

### Sincronización:
- [ ] Al completar inspección, FECHA se actualiza en AppSheet
- [ ] PRÓXIMO MANTENIMIENTO se recalcula automáticamente
- [ ] PROGRESO cambia a "COMPLETADO"

---

## 🔗 URLs Importantes

**GitHub Pages (para probar AHORA):**
```
https://alejandro38-re.github.io/aplicacion-web-retimbrasur/aplicacion%20informes/index.html
```

**Hostinger (para producción):**
```
https://retimbrasur.com/index.html
```

**AppSheet Redirect (para sync de vuelta):**
```
https://www.appsheet.com/redirect
```

---

## 📞 Soporte

### Problemas Comunes:

| Síntoma | Guía a Consultar |
|---------|------------------|
| Veo `[_THISROW].[Campo]` | APPSHEET_FIX_PLACEHOLDERS.md → Solución 1 |
| "Column not found" error | APPSHEET_FIX_PLACEHOLDERS.md → Solución 6 |
| Campos vacíos en la app | APPSHEET_SETUP.md → Paso 3 (Mapeo) |
| Badge de pago no parpadea | APPSHEET_SETUP.md → Problema 2 |
| AppSheet no se actualiza | APPSHEET_SETUP.md → Problema 4 |
| El botón no aparece | APPSHEET_QUICK_START.md → Paso 3 |

---

## 🔄 Versiones

- **v2.2.1** (15/12/2024): Integración completa AppSheet + información de contacto y pago
- **v2.2.0** (15/12/2024): Sincronización de fechas de mantenimiento
- **v2.1.0**: Mejoras visuales tablets/móviles
- **v2.0.0**: PWA con service worker

---

## 📝 Notas de Implementación

### Campos Sincronizados:
- **De AppSheet → Web App (Lectura):**
  - CENTRO, FECHA, PRÓXIMO MANTENIMIENTO, MANT
  - CONTACTO, TELEFONO, EMAIL
  - IMPORTE, PAGO EFECTIVO, OBSERVACIONES, PROGRESO

- **De Web App → AppSheet (Escritura):**
  - FECHA: Nueva fecha de inspección
  - PROGRESO: "COMPLETADO"
  - (PRÓXIMO MANTENIMIENTO se recalcula automáticamente con fórmula IFS)

### Seguridad:
- ✅ Todas las URLs usan HTTPS (GitHub Pages y Hostinger)
- ⚠️ Datos de contacto visibles en URL (solo compartir con técnicos autorizados)
- ✅ ENCODEURL() protege contra inyección de caracteres especiales

---

**¿Listo para empezar?**

👉 Abre **APPSHEET_QUICK_START.md** y configura tu botón en 5 minutos.

🎉 **¡Buena suerte con la integración!**
