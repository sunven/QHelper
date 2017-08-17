$(".q-list li").click(function () {
    chrome.tabs.create({
        url: "../../template/json/index.html",
        active: true
    })
});