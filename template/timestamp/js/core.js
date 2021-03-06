var baidu = function() {
    this.version = "1.3.5"
};
baidu.namespace = new Object();
baidu.namespace.register = function(e) {
    var c = /^[_$a-z]+[_$a-z0-9]*/i;
    var d = e.split(".");
    var g = "";
    var f = "";
    var a = [window];
    for (var b = 0; b < d.length; b++) {
        if (!c.test(d[b])) {
            throw new Error("Invalid namespace:" + d[b] + "");
            return
        }
        a[b + 1] = a[b][d[b]];
        if (typeof a[b + 1] == "undefined") {
            a[b + 1] = new Object()
        }
    }
}
;
String.prototype.trim = function() {
    return this.replace(/^\s*|\s*$/g, "")
}
;
String.prototype.format = function() {
    var b = arguments.length
      , a = this;
    while (b--) {
        a = a.replace(new RegExp("\\{" + b + "\\}","g"), arguments[b])
    }
    return a
}
;
Date.prototype.format = function(e) {
    var a = function(m, l) {
        var n = ""
          , k = (m < 0)
          , j = String(Math.abs(m));
        if (j.length < l) {
            n = (new Array(l - j.length + 1)).join("0")
        }
        return (k ? "-" : "") + n + j
    };
    if ("string" != typeof e) {
        return this.toString()
    }
    var b = function(k, j) {
        e = e.replace(k, j)
    };
    var f = this.getFullYear()
      , d = this.getMonth() + 1
      , i = this.getDate()
      , g = this.getHours()
      , c = this.getMinutes()
      , h = this.getSeconds();
    b(/yyyy/g, a(f, 4));
    b(/yy/g, a(parseInt(f.toString().slice(2), 10), 2));
    b(/MM/g, a(d, 2));
    b(/M/g, d);
    b(/dd/g, a(i, 2));
    b(/d/g, i);
    b(/HH/g, a(g, 2));
    b(/H/g, g);
    b(/hh/g, a(g % 12, 2));
    b(/h/g, g % 12);
    b(/mm/g, a(c, 2));
    b(/m/g, c);
    b(/ss/g, a(h, 2));
    b(/s/g, h);
    return e
}
;
String.prototype.getBytes = function() {
    var b = this.replace(/\n/g, "xx").replace(/\t/g, "x");
    var a = encodeURIComponent(b);
    return a.replace(/%[A-Z0-9][A-Z0-9]/g, "x").length
}
;
var getOuterHtmlEllipsis = function(d) {
    var b = /(<[^>]+>)/g;
    var a = b.exec(d.outerHTML);
    var c = a ? a[1] : d.outerHTML;
    c = c.length > 40 ? c.substr(0, 40) + "..." : c;
    return c.replace(/</g, "&lt;").replace(/>/g, "&gt;")
};
var getOuterAndInnerHtmlEllipsis = function(b) {
    var a = jQuery("<div></div>").append(b).html()
};
(function() {
    baidu.i18n = {};
    baidu.i18n.getMessage = function(d, b) {
        if (b) {
            for (var c = 0, a = b.length; c < a; c++) {
                b[c] = "" + b[c]
            }
            return chrome.i18n.getMessage(d, b)
        } else {
            return chrome.i18n.getMessage(d)
        }
    }
}
)();
