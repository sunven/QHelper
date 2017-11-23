var ImageBase64 = (function () {
    var a = function (d) {
        if (isNaN(d)) {
            return "暂无数据"
        }
        d = +d;
        if (d < 1024) {
            return d + " B"
        } else {
            if (d < 1024 * 1024) {
                return (d / 1024).toFixed(2) + " KB"
            } else {
                return (d / 1024 / 1024).toFixed(2) + " MB"
            }
        }
    };
    var c = function (e) {
        var d = new FileReader();
        d.onload = function (f) {
            $("#result").val(f.target.result);
            $("#preview").attr("src", f.target.result).show();
            $("td .x-panel").css("background-image", "none");
            $("#sizeOri").html(a(e.size));
            $("#sizeBase").html(a(f.target.result.length))
        };
        d.readAsDataURL(e)
    };
    var b = function () {
        $("textarea").bind("click", function (f) {
            this.select()
        });
        var d = $("#file").change(function (f) {
            if (this.files.length) {
                c(this.files[0]);
                this.value = ""
            }
        });
        $("#upload").click(function (f) {
            f.preventDefault();
            d.trigger("click")
        });
        document.onpaste = function (i) {
            var e = (i.clipboardData || i.originalEvent.clipboardData).items;
            for (var f in e) {
                var h = e[f];
                if (/image\//.test(h.type)) {
                    var g = h.getAsFile();
                    c(g);
                    break
                }
            }
        };
        $(document).bind("drop", function (g) {
            g.preventDefault();
            g.stopPropagation();
            var f = g.originalEvent.dataTransfer.files;
            if (f.length) {
                if (/image\//.test(f[0].type)) {
                    c(f[0])
                } else {
                    alert("请选择图片文件！")
                }
            }
        }).bind("dragover", function (f) {
            f.preventDefault();
            f.stopPropagation()
        })
    };
    $(function () {
        b()
    })
})();