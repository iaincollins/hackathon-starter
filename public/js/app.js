$(function() { 
  $('a[data-toggle="modal"]').attr('href', "#");
  $('a[data-toggle="dropdown"]').attr('href', "#");
  $(".modal-draggable .modal-dialog").draggable({
      handle: ".modal-header"
  });
  $("time.timeago").timeago();
});