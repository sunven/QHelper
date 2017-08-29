$(".q-list li").click(function () {
    var $this=$(this);
    chrome.tabs.create({
        url: $this.attr("data-url"),
        active: true
    })
});