const DIGEST_QUEUE_SHEET = 'DigestQueue';
const DIGEST_SETTINGS_SHEET = 'DigestSettings';
const DIGEST_LOG_SHEET = 'DigestLog';

function sendDailyDigest() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const queueSheet = spreadsheet.getSheetByName(DIGEST_QUEUE_SHEET);
  const settingsSheet = spreadsheet.getSheetByName(DIGEST_SETTINGS_SHEET);
  const logSheet = spreadsheet.getSheetByName(DIGEST_LOG_SHEET);

  if (!queueSheet || !settingsSheet || !logSheet) {
    throw new Error('Digest bridge sheets are missing.');
  }

  const settings = readSettings(settingsSheet);

  if (settings.enabled !== 'TRUE') {
    writeLog(logSheet, settings.recipient, 0, 'skipped', 'Digest disabled.');
    return;
  }

  if (!settings.recipient) {
    writeLog(logSheet, '', 0, 'skipped', 'Digest recipient missing.');
    return;
  }

  const rows = readQueue(queueSheet);
  const pendingRows = rows.filter((row) => row.sent !== 'TRUE');

  if (pendingRows.length === 0) {
    writeLog(logSheet, settings.recipient, 0, 'skipped', 'No pending digest rows.');
    return;
  }

  const subject = `Sundesk digest. ${pendingRows.length} items need attention.`;
  const body = buildDigestBody(pendingRows);

  MailApp.sendEmail({
    to: settings.recipient,
    subject,
    body,
  });

  markRowsSent(queueSheet, pendingRows);
  writeLog(logSheet, settings.recipient, pendingRows.length, 'sent', '');
}

function readSettings(sheet) {
  const values = sheet.getDataRange().getValues();
  const settings = {};

  values.slice(1).forEach((row) => {
    settings[row[0]] = String(row[1] || '');
  });

  return {
    recipient: settings.recipient || '',
    enabled: settings.enabled || 'TRUE',
  };
}

function readQueue(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  return values.slice(1).map((row, index) => {
    const record = { rowNumber: index + 2 };

    headers.forEach((header, columnIndex) => {
      record[header] = String(row[columnIndex] || '');
    });

    return record;
  });
}

function buildDigestBody(rows) {
  const lines = [
    'Sundesk digest.',
    '',
    'Track status. Not files.',
    '',
  ];

  rows.forEach((row, index) => {
    lines.push(`${index + 1}. ${row.title}`);
    lines.push(`Community: ${row.community}`);
    lines.push(`Priority: ${row.priority}`);
    lines.push(`Reason: ${row.reason}`);
    lines.push(`Due: ${row.dueDate || 'No date'}`);
    lines.push('');
  });

  lines.push('End of digest.');

  return lines.join('\n');
}

function markRowsSent(sheet, rows) {
  rows.forEach((row) => {
    sheet.getRange(row.rowNumber, 10).setValue('TRUE');
  });
}

function writeLog(sheet, recipient, itemCount, status, error) {
  sheet.appendRow([
    new Date(),
    recipient,
    itemCount,
    status,
    error,
  ]);
}
