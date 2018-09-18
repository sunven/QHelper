$(".q-list li").click(function () {
    var $this = $(this);
    var type = $this.attr("type")
    if (type == "jump") {
        chrome.tabs.create({
            url: $this.attr("data-url"),
            active: true
        })
    } else if (type == "clearCookie") {
        chrome.tabs.getSelected(function (tab) {
            var reg = /^http(s)?:\/\/(.*?)\//;
            var url = reg.exec(tab.url)[0];
            // var r = confirm("确定要删除【"+url + "】的cookie吗?");
            // if (!r) {
            //     return;
            // }
            chrome.cookies.getAll({
                url: url
            }, function (arr) {
                for (let index = 0; index < arr.length; index++) {
                    var element = arr[index];
                    chrome.cookies.remove({
                        url: url,
                        name: element.name
                    })
                }
                window.close();
            })
        })
    }
});