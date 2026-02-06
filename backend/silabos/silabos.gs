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
    const asignatura = asignaturasData.find(a => a.asignatura_id === silabo.asignatura_id);
    return {
      ...silabo,
      asignatura: asignatura || {}
    };
  });
}

function getSyllabusContent(ss, silaboId) {
  const silabo = getSilabos(ss).find(s => s.silabo_id === silaboId);
  if (!silabo) return { error: 'Silabo not found' };

  const unidades = getSheetData(ss.getSheetByName('Unidades')).filter(u => u.silabo_id === silaboId);
  const clases = getSheetData(ss.getSheetByName('Clases_Plan'));
  const asignaciones = getSheetData(ss.getSheetByName('Asignaciones'));
  const criterios = getSheetData(ss.getSheetByName('Criterios_Evaluacion'));

  const resultUnidades = unidades.map(unidad => {
    const unidadClases = clases.filter(c => c.unidad_id === unidad.unidad_id).map(clase => {
      const claseAsignacion = asignaciones.find(a => a.clase_id === clase.clase_id);
      let asignacionConCriterios = null;
      if (claseAsignacion) {
        const asigCriterios = criterios.filter(cr => cr.asignacion_id === claseAsignacion.asignacion_id);
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
  const clases = getSheetData(ss.getSheetByName('Clases_Plan'));
  const clase = clases.find(c => c.clase_id === claseId);

  if (!clase) return { error: 'Clase not found' };

  const recursos = getSheetData(ss.getSheetByName('Recursos')).filter(r => r.clase_id === claseId);
  const asignaciones = getSheetData(ss.getSheetByName('Asignaciones')).filter(a => a.clase_id === claseId);
  const criteriosAll = getSheetData(ss.getSheetByName('Criterios_Evaluacion'));

  const asignacionesConCriterios = asignaciones.map(asig => {
    const criterios = criteriosAll.filter(cr => cr.asignacion_id === asig.asignacion_id);
    return {
      ...asig,
      criterios: criterios
    };
  });

  const unidades = getSheetData(ss.getSheetByName('Unidades'));
  const unidad = unidades.find(u => u.unidad_id === clase.unidad_id);

  const asignaturasSheet = ss.getSheetByName('Asignaturas');
  const asignaturasData = getSheetData(asignaturasSheet);

  const silabosSheet = ss.getSheetByName('Silabos');
  const silabosData = getSheetData(silabosSheet);

  const silabo = silabosData.find(s => s.silabo_id === (unidad ? unidad.silabo_id : ''));
  const asignatura = silabo ? asignaturasData.find(a => a.asignatura_id === silabo.asignatura_id) : null;

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

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
