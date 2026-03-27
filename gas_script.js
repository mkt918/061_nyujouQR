/**
 * 学校入場受付システム用 Google Apps Script (GAS)
 * 
 * ==========================================
 * 【スプレッドシートの準備と導入手順】
 * ==========================================
 * 1. スプレッドシートを新規作成し、以下のシート名に変更／追加します。
 *    - 「参加者リスト」シート：フォームの送信先シートです。以下の列構成としてください。
 *       [A列: タイムスタンプ, B列: メールアドレス, C列: 出席番号, D列: 保護者氏名, E列: 続柄, F列: チケットID(自動採番)]
 *    - 「入場記録」シート：入場時の履歴保存用です。(空でOKです。自動生成されます)
 * 
 * 2. このスクリプトを「拡張機能」>「Apps Script」を選択してペーストします。
 * 
 * 3. フォームの送信時トリガーを設定します。
 *    - 時計アイコン(トリガー) > 「トリガーを追加」 > 「onFormSubmit」 > 「スプレッドシートから」 > 「フォーム送信時」を選択して保存。
 * 
 * 4. Webアプリとして公開します。
 *    - 「デプロイ」>「新しいデプロイ」を選択。
 *    - 「種類の選択」から歯車アイコンで「ウェブアプリ」を選択。
 *    - 「次のユーザーとして実行」: 「自分」
 *    - 「アクセスできるユーザー」: 「全員」
 *    - デプロイボタンを押し、表示された「ウェブアプリのURL」をコピーします。
 *    - コピーしたURLを、フロント側のWebアプリ（QRリーダー）の設定入力欄に貼り付けます。
 */

// ==========================================
// 1. フォーム送信時：QRコード付きメール自動送信
// ==========================================
function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("参加者リスト");
  
  // フォームデータが末尾の行に追加されたと仮定 (もしくはイベントオブジェクトeから取得)
  var row = e ? e.range.getRow() : sheet.getLastRow();
  
  var email = sheet.getRange(row, 2).getValue();
  var studentId = sheet.getRange(row, 3).getValue();
  var parentName = sheet.getRange(row, 4).getValue();
  var relation = sheet.getRange(row, 5).getValue();
  
  // チケットごとに一意なID（UUID）を生成し、F列(6列目)に保存
  var ticketId = Utilities.getUuid();
  sheet.getRange(row, 6).setValue(ticketId);
  
  // QRコードに含めるデータ（JSON形式）
  var qrData = JSON.stringify({
    id: String(studentId),
    ticketId: ticketId
  });
  
  // Google Chart API を使ってQRコード画像URLを生成 (300x300サイズ)
  var qrCodeUrl = "https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=" + encodeURIComponent(qrData);
  
  var subject = "【入場受付】入場用QRコード（チケット）のご案内";
  var body = parentName + " 様\n\n" +
             "ご登録ありがとうございます。\n当日の入場時にご提示いただくQRコードを発行いたしました。\n\n" +
             "・出席番号: " + studentId + "\n" +
             "・続柄: " + relation + "\n\n" +
             "受付窓口にて、以下のURLのリンク先にあるQRコードをご提示ください。\n" +
             qrCodeUrl + "\n\n" +
             "----------------------------------\n" +
             "※このメールは自動送信システムより送信されています。";
             
  var htmlBody = "<p>" + parentName + " 様</p><p>ご登録ありがとうございます。<br>当日の入場時にご提示いただくQRコードを発行いたしました。</p>" +
                 "<ul><li><b>出席番号:</b> " + studentId + "</li><li><b>続柄:</b> " + relation + "</li></ul>" +
                 "<p>受付窓口にて、以下のQRコードをご提示ください。</p>" +
                 "<p><img src='" + qrCodeUrl + "' alt='QR Code'></p>" +
                 "<hr><p><small>※このメールは自動送信システムより送信されています。</small></p>";
                 
  // 指定されたメールアドレスに送信
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      htmlBody: htmlBody
    });
  }
}

// ==========================================
// 2. Webアプリからの受付API処理
// ==========================================
function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // Webアプリから送信されたJSONデータを解析
    var data = JSON.parse(e.postData.contents);
    var studentId = data.id;
    var ticketId = data.ticketId;
    var maxLimit = data.maxLimit || 2; // デフォルト上限数
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var recordSheet = ss.getSheetByName("入場記録");
    
    // 記録シートが無い場合は作成
    if (!recordSheet) {
      recordSheet = ss.insertSheet("入場記録");
      recordSheet.appendRow(["入場日時", "チケットID", "出席番号", "判定結果", "該当番号の入場回数"]);
      // ヘッダー行を固定
      recordSheet.setFrozenRows(1);
    }
    
    var timestamp = new Date();
    var todayStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy/MM/dd");
    
    var isDuplicateTicket = false;
    var currentCount = 0; // 今日、この出席番号ですでに入場した回数
    
    var lastRow = recordSheet.getLastRow();
    if (lastRow > 1) {
      var dataRange = recordSheet.getRange(2, 1, lastRow - 1, 4).getValues();
      
      for (var i = 0; i < dataRange.length; i++) {
        var rowDate = new Date(dataRange[i][0]);
        var rowDateStr = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy/MM/dd");
        var rowTicketId = dataRange[i][1];
        var rowStudentId = dataRange[i][2];
        var rowResult = dataRange[i][3]; // "OK" のものだけ合法とみなす
        
        // 重複チケットのチェック（同じQRが使い回されていないか）
        if (ticketId && rowTicketId === ticketId && rowResult === "OK") {
          isDuplicateTicket = true;
        }
        
        // 今日の該当出席番号の入場回数をカウント
        if (rowDateStr === todayStr && String(rowStudentId) === String(studentId) && rowResult === "OK") {
          currentCount++;
        }
      }
    }
    
    // エラー：既に使用されたチケットである場合
    if (isDuplicateTicket && ticketId) {
      recordSheet.appendRow([timestamp, ticketId, studentId, "NG: 使用済みチケット", currentCount]);
      return output.setContent(JSON.stringify({ status: "error", message: "このチケット（QR）はすでに受付済みです" }));
    }
    
    // エラー：家庭あたりの入場上限を超えている場合
    if (currentCount >= maxLimit) {
      recordSheet.appendRow([timestamp, ticketId || "", studentId, "NG: 上限到達", currentCount]);
      return output.setContent(JSON.stringify({ status: "error", message: "出席番号「" + studentId + "」の入場上限（" + maxLimit + "名）に達しています" }));
    }
    
    // 正常：入場手続きOK
    currentCount++; // 今回の1名分を加算
    recordSheet.appendRow([timestamp, ticketId || "", studentId, "OK", currentCount]);
    
    return output.setContent(JSON.stringify({ 
      status: "success", 
      count: currentCount,
      maxLimit: maxLimit
    }));
    
  } catch (err) {
    return output.setContent(JSON.stringify({ status: "error", message: err.toString() }));
  }
}

// プリフライトリクエスト(CORS用)
function doOptions(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  return output.setContent(JSON.stringify({status: "ok"}));
}
