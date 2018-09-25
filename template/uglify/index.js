$(function(){
    $("#codeSource").change(function () {
        uglifyCode();
    });
});

function uglifyCode() {
    var result = UglifyJS.minify(document.querySelector("#codeSource").value);
    if (result.error == undefined) {
        document.querySelector("#codeDist").value = result.code;
    } else {
        console.log(result.error)
    }
}