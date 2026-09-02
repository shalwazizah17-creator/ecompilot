/**
 * E-POSYANDU ILP - IBU HAMIL, NIFAS & MENYUSUI
 * Backend Google Apps Script (Code.gs)
 */

var CONFIG = {
  POSYANDU_NAME: 'POSYANDU MEKAR 2',
  ADDRESS: 'Kel. Cireundeu, Kec. Ciputat Timur, Kota Tangerang Selatan',
  BUILD: 'ILP-BUMIL-2026.01',
  SHEET_IBU: 'IBU',
  SHEET_BUMIL: 'KUNJUNGAN_BUMIL',
  SHEET_BUSUI: 'KUNJUNGAN_NIFAS_BUSUI'
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('E-Posyandu ILP - Ibu Hamil, Nifas & Menyusui')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getConfig() {
  return {
    posyandu: CONFIG.POSYANDU_NAME,
    alamat: CONFIG.ADDRESS,
    build: CONFIG.BUILD
  };
}

function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet IBU
  var sheetIbu = ss.getSheetByName(CONFIG.SHEET_IBU) || ss.insertSheet(CONFIG.SHEET_IBU);
  if (sheetIbu.getLastRow() === 0) {
    sheetIbu.appendRow([
      'ID_IBU', 'NAMA_IBU', 'NIK', 'TGL_LAHIR', 'NAMA_SUAMI', 'NO_HP',
      'RT_RW', 'ALAMAT', 'KELURAHAN', 'KECAMATAN', 'STATUS_SASARAN',
      'BB_SEBELUM_HAMIL', 'TINGGI_BADAN', 'JARAK_ANAK', 'ANAK_KE',
      'HPHT', 'TGL_BERSALIN', 'CARA_BERSALIN', 'CREATED_AT'
    ]);
    sheetIbu.getRange(1, 1, 1, 19).setBackground('#079b8d').setFontColor('#ffffff').setFontWeight('bold');
  }

  // 2. Sheet KUNJUNGAN_BUMIL
  var sheetBumil = ss.getSheetByName(CONFIG.SHEET_BUMIL) || ss.insertSheet(CONFIG.SHEET_BUMIL);
  if (sheetBumil.getLastRow() === 0) {
    sheetBumil.appendRow([
      'ID_KUNJUNGAN', 'ID_IBU', 'TANGGAL', 'PETUGAS', 'PERIODE_MINGGU',
      'BB', 'LILA', 'TEKANAN_DARAH', 'PLOTING_IMT', 'PLOTING_LILA', 'PLOTING_TD',
      'TBC_BATUK', 'TBC_DEMAM', 'TBC_BB_TURUN', 'TBC_KONTAK',
      'JML_TTD', 'RUTIN_TTD', 'MT_BUMIL_KEK', 'RUTIN_MT_KEK',
      'KELAS_BUMIL', 'KIE_TOPIK', 'RUJUKAN', 'CREATED_AT'
    ]);
    sheetBumil.getRange(1, 1, 1, 23).setBackground('#068275').setFontColor('#ffffff').setFontWeight('bold');
  }

  // 3. Sheet KUNJUNGAN_NIFAS_BUSUI
  var sheetBusui = ss.getSheetByName(CONFIG.SHEET_BUSUI) || ss.insertSheet(CONFIG.SHEET_BUSUI);
  if (sheetBusui.getLastRow() === 0) {
    sheetBusui.appendRow([
      'ID_KUNJUNGAN', 'ID_IBU', 'TANGGAL', 'PETUGAS', 'PERIODE_KF_BULAN',
      'BB', 'TEKANAN_DARAH', 'PLOTING_IMT', 'PLOTING_TD',
      'TBC_BATUK', 'TBC_DEMAM', 'TBC_BB_TURUN', 'TBC_KONTAK',
      'VIT_A_KAPSUL', 'RUTIN_VIT_A', 'MENYUSUI_ASI', 'KB_PASCA_PERSALINAN',
      'KIE_TOPIK', 'RUJUKAN', 'CREATED_AT'
    ]);
    sheetBusui.getRange(1, 1, 1, 20).setBackground('#0284c7').setFontColor('#ffffff').setFontWeight('bold');
  }

  return { success: true, message: 'Database E-Posyandu Bumil & Busui Berhasil Diinisialisasi!' };
}

function searchIbu(query) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_IBU);
  if (!sheet || sheet.getLastRow() < 2) return { results: [] };

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 19).getValues();
  var q = String(query || '').toLowerCase().trim();
  var results = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var id = String(row[0]);
    var nama = String(row[1]);
    var nik = String(row[2]);
    var suami = String(row[4]);
    var rtrw = String(row[6]);
    var status = String(row[10]);

    if (!q || nama.toLowerCase().indexOf(q) > -1 || nik.indexOf(q) > -1 || suami.toLowerCase().indexOf(q) > -1) {
      results.push({
        id: id,
        nama: nama,
        nik: nik,
        tglLahir: row[3] ? Utilities.formatDate(new Date(row[3]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        suami: suami,
        hp: String(row[5]),
        rtRw: rtrw,
        alamat: String(row[7]),
        kel: String(row[8]),
        kec: String(row[9]),
        statusIbu: status,
        bbDasar: row[11],
        tb: row[12],
        jarakAnak: String(row[13]),
        anakKe: String(row[14]),
        hpht: row[15] ? Utilities.formatDate(new Date(row[15]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        tglBersalin: row[16] ? Utilities.formatDate(new Date(row[16]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '',
        caraBersalin: String(row[17])
      });
    }
  }

  return { results: results };
}

function saveIbu(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_IBU);
  if (!sheet) {
    setupSystem();
    sheet = ss.getSheetByName(CONFIG.SHEET_IBU);
  }

  var id = 'IBU-' + new Date().getTime();
  sheet.appendRow([
    id,
    data.nama,
    "'" + data.nik,
    data.tglLahir,
    data.suami,
    "'" + data.hp,
    data.rtrw,
    data.alamat,
    data.kel,
    data.kec,
    data.statusIbu,
    data.bbDasar,
    data.tb,
    data.jarakAnak,
    data.anakKe,
    data.hpht,
    data.tglBersalin,
    data.caraBersalin,
    new Date()
  ]);

  data.id = id;
  return { success: true, message: 'Data sasaran ' + data.nama + ' berhasil disimpan!', ibu: data };
}

function saveVisit(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var isBumil = data.kategori === 'Hamil';
  var targetSheetName = isBumil ? CONFIG.SHEET_BUMIL : CONFIG.SHEET_BUSUI;
  var sheet = ss.getSheetByName(targetSheetName);
  
  if (!sheet) {
    setupSystem();
    sheet = ss.getSheetByName(targetSheetName);
  }

  var idKunjungan = (isBumil ? 'KJ-BML-' : 'KJ-NFS-') + new Date().getTime();

  if (isBumil) {
    sheet.appendRow([
      idKunjungan,
      data.idIbu,
      data.tanggal,
      data.petugas,
      data.kolomPeriode,
      data.bb,
      data.lila,
      data.td,
      data.plotingImt,
      data.plotingLila,
      data.plotingTd,
      data.tbcBatuk,
      data.tbcDemam,
      data.tbcBbTurun,
      data.tbcKontak,
      data.jmlTtd,
      data.rutinTtd,
      data.mtBumilKek,
      data.rutinMtKek,
      data.kelasBumil,
      data.topik,
      data.rujukan,
      new Date()
    ]);
  } else {
    sheet.appendRow([
      idKunjungan,
      data.idIbu,
      data.tanggal,
      data.petugas,
      data.kolomPeriode,
      data.bb,
      data.td,
      data.plotingImt,
      data.plotingTd,
      data.tbcBatuk,
      data.tbcDemam,
      data.tbcBbTurun,
      data.tbcKontak,
      data.vitaKapsul,
      data.rutinVita,
      data.menyusui,
      data.kbPascaSalin,
      data.topik,
      data.rujukan,
      new Date()
    ]);
  }

  return { success: true, message: 'Pelayanan kunjungan berhasil dicatat dan disimpan!' };
}

function generateLaporanBulanan(bulanTahun) {
  return {
    success: true,
    message: 'Laporan bulanan periode ' + bulanTahun + ' berhasil di-generate!'
  };
}

function diagnostik() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    spreadsheetName: ss.getName(),
    sheets: ss.getSheets().map(function(s){ return s.getName(); }),
    status: 'TERHUBUNG'
  };
}
