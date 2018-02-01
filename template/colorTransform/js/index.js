$(function () {
    $("#btnRgb2Sixteen").click(function () {
        rgb2Sixteen();
    });

    $("#btnSixteen2Rgb").click(function () {
        sixteen2rgb();
    });
});

function rgb2Sixteen() {
    hexcode = "#";
    for (x = 0; x < 3; x++) {
        var n = $('#txtSrcRgb' + x).val();
        if (n == "") n = "0";
        if (parseInt(n) != n) {
            alert("请输入数字！");
            return false;
        }
        if (n < 0 || n > 255) {
            alert("数字在0-255之间！");
            return false;
        }
        var c = "0123456789abcdef";
        var b = "";
        var a = n % 16;
        b = c.substr(a, 1);
        a = (n - a) / 16;
        hexcode += c.substr(a, 1) + b
    }
    $("#txtDesHex").val(hexcode).css("border", "4px solid " + hexcode);
}

function sixteen2rgb() {;
    var a = $('#txtSrcHex').val();
    if (a.substr(0, 1) == "#") {
        a = a.substring(1);
    }
    if (a.length != 6) {
        alert("请输入正确的颜色编码！");
        return false;
    }
    a = a.toLowerCase();
    b = new Array();
    for (x = 0; x < 3; x++) {
        b[0] = a.substr(x * 2, 2);
        b[3] = "0123456789abcdef";
        b[1] = b[0].substr(0, 1);
        b[2] = b[0].substr(1, 1);
        b[20 + x] = b[3].indexOf(b[1]) * 16 + b[3].indexOf(b[2])
    }
    $("#txtDesRgb0").val(b[20]);
    $("#txtDesRgb1").val(b[21]);
    $("#txtDesRgb2").val(b[22]);
    $("input[id^='txtDesRgb']").css("border", "4px solid #" + a);
}