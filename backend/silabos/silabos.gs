function doGet(e) {
  const action = e.parameter.action;
  const spreadsheetId = '1uFTNgCJAM59_Z-5aMNeZiDRxWjcv2tBE_kJTUowbADg';
  const ss = SpreadsheetApp.openById(spreadsheetId);

  let result;

  try {
    if (!action) {
      result = {
        status: "success",
        message: "Microservicio de Sílabos activo",
        available_actions: ["getSilabos", "getSyllabusContent", "getPlanDetails"]
      };
    } else if (action === 'getSilabos') {
      result = getSilabos(ss);
    } else if (action === 'getSyllabusContent') {
      const silaboId = e.parameter.silabo_id;
      result = getSyllabusContent(ss, silaboId);
    } else if (action === 'getPlanDetails') {
      const claseId = e.parameter.clase_id;
      result = getPlanDetails(ss, claseId);
    } else {
      result = {
        error: 'Invalid action',
        received_action: action,
        available_actions: ["getSilabos", "getSyllabusContent", "getPlanDetails"]
      };
    }
  } catch (error) {
    result = { error: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSilabos(ss) {
  const silabosSheet = ss.getSheetByName('Silabos');
  const asignaturasSheet = ss.getSheetByName('Asignaturas');

  if (!silabosSheet || !asignaturasSheet) return { error: 'Sheets not found' };

  const silabosData = getSheetData(silabosSheet);
  const asignaturasData = getSheetData(asignaturasSheet);

  return silabosData.map(silabo => {
    const asignatura = asignaturasData.find(a => String(a.asignatura_id) === String(silabo.asignatura_id));
    return {
      ...silabo,
      asignatura: asignatura || {}
    };
  });
}

function getSyllabusContent(ss, silaboId) {
  const silabos = getSilabos(ss);
  const silabo = silabos.find(s => String(s.silabo_id) === String(silaboId));
  if (!silabo) return { error: 'Silabo not found: ' + silaboId };

  const unidades = getSheetData(ss.getSheetByName('Unidades')).filter(u => String(u.silabo_id) === String(silaboId));
  const clasesAll = getSheetData(ss.getSheetByName('Clases_Plan'));
  const asignacionesAll = getSheetData(ss.getSheetByName('Asignaciones'));
  const criteriosAll = getSheetData(ss.getSheetByName('Criterios_Evaluacion'));

  const resultUnidades = unidades.map(unidad => {
    const unidadClases = clasesAll.filter(c => String(c.unidad_id) === String(unidad.unidad_id)).map(clase => {
      const claseAsignacion = asignacionesAll.find(a => String(a.clase_id) === String(clase.clase_id));
      let asignacionConCriterios = null;
      if (claseAsignacion) {
        const asigCriterios = criteriosAll.filter(cr => String(cr.asignacion_id) === String(claseAsignacion.asignacion_id));
        asignacionConCriterios = {
          ...claseAsignacion,
          criterios: asigCriterios
        };
      }
      return {
        ...clase,
        asignacion: asignacionConCriterios
      };
    });
    return {
      ...unidad,
      clases: unidadClases
    };
  });

  return {
    silabo: silabo,
    unidades: resultUnidades
  };
}

function getPlanDetails(ss, claseId) {
  const clasesAll = getSheetData(ss.getSheetByName('Clases_Plan'));
  const clase = clasesAll.find(c => String(c.clase_id) === String(claseId));

  if (!clase) return { error: 'Clase not found: ' + claseId };

  const recursos = getSheetData(ss.getSheetByName('Recursos')).filter(r => String(r.clase_id) === String(claseId));
  const asignaciones = getSheetData(ss.getSheetByName('Asignaciones')).filter(a => String(a.clase_id) === String(claseId));
  const criteriosAll = getSheetData(ss.getSheetByName('Criterios_Evaluacion'));

  const asignacionesConCriterios = asignaciones.map(asig => {
    const criterios = criteriosAll.filter(cr => String(cr.asignacion_id) === String(asig.asignacion_id));
    return {
      ...asig,
      criterios: criterios
    };
  });

  const unidadesAll = getSheetData(ss.getSheetByName('Unidades'));
  const unidad = unidadesAll.find(u => String(u.unidad_id) === String(clase.unidad_id));

  const silabosAll = getSheetData(ss.getSheetByName('Silabos'));
  const silabo = unidad ? silabosAll.find(s => String(s.silabo_id) === String(unidad.silabo_id)) : null;

  const asignaturasAll = getSheetData(ss.getSheetByName('Asignaturas'));
  const asignatura = silabo ? asignaturasAll.find(a => String(a.asignatura_id) === String(silabo.asignatura_id)) : null;

  return {
    clase: clase,
    recursos: recursos,
    asignaciones: asignacionesConCriterios,
    unidad: unidad,
    silabo: silabo,
    asignatura: asignatura
  };
}

function getSheetData(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim()); // Trim headers to avoid trailing spaces
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      if (value instanceof Date) {
        value = formatDate(value);
      }
      obj[header] = value;
    });
    return obj;
  });
}

function formatDate(date) {
  if (!(date instanceof Date)) return date;
  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  return day + "/" + month + "/" + year;
}
