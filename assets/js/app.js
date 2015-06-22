(function($, undefined) {

  $(document).ready(function() {

    var names = location.pathname.split("/");
    var active = false;
    $("nav navbar-nav .active").removeClass("active");
    for (var i = 0; i < names.length; ++i) {
      if (names[i]) {
        $("#nav-" + names[i]).addClass("active");
        active = true;
        break;
      }
    }
    if (!active)
      $("#nav-home").addClass("active");

  });

})(jQuery);
