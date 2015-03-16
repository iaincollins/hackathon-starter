/**
* Form field validator wrapper
*/
$(document).on('submit', 'form[data-validator="true"]', function(e) {

  // Go ahead and submit form if data-validated=true attribute already set
  if ($(this).attr('data-validated') == "true")
    return;
    
  e.preventDefault();
  
  $('*[type="submit"]', this).addClass('disabled');
  
  var form = this;
  
  $.ajax({
    url: this.action,
    type: this.method,
    data: $(this).serialize(),
    dataType: 'json',
    headers: { 'X-Validate': 'true' },
    cache: false, // Append timestamp
    success: function(response) {
      if (response.errors == {}) {
        // If no errors, then add data-validated=true attribute
        $(form).attr('data-validated', 'true');
        $(form).submit();
      } else {
        // If therere are errors, then highlight the fields with errors.
        $('*[type="submit"]', form).removeClass('disabled');
        var alertHtml = '';
        $(".messages", form).html('');
        for (var i = 0; i < response['errors'].length; i++) {
          var field = response['errors'][i]['param'];
          var msg = response['errors'][i]['msg'];
          
          // Find the field in the form with the error
          var target = null;
          if ($('*[name="'+field+'"]', form).is(":visible")) {
            target = $('*[name="'+field+'"]', form);
          } else if ($('*[name="'+field+'"]', form).is("select")) {
            // In the case of styled select elements (which are hidden),
            // choose the nearest "boostrap select" element.
            target = $('*[name="'+field+'"]', form).siblings('.bootstrap-select');
          }
          // Add the error class to the target's container
          if (target != null) {
            target.parents(".form-group").addClass('has-error');
            //target.tooltip("destroy");            
//            alert(msg);
            if (msg != '') {
              // target.attr('title', message);
              // target.tooltip({ trigger: 'manual', placement: 'bottom'});
              // target.tooltip('show');
              alertHtml += '<div class="alert alert-danger" data-field="'+field+'">'
                          +'<i class="fa fa-lg fa-fw fa-warning"></i> '
                          +'<span>'+msg+'</span></div>';
            }
          }
        }
        $(".messages", form).html(alertHtml);        
      }
    },
    error: function() {          
      // If validation fails, then set the data-validator attribute to false,
      // allowing the form to submit normally and the server to handle the error
      $(form).attr('data-validator', 'false');
      $('*[type="submit"]', form).removeClass('disabled');
      $(form).submit();
    }
  });
  
  return false;
});

// Remove .has-error class and tooltips from fields if they change/are focused
$(document).on('focus blur keydown change', '.has-error', function() {
  $(this).removeClass("has-error");
  var form = $(this).parents('form');
//  $(this).children('*[name="'+field+'"]'
  
//             if ($('*[name="'+field+'"]', form).is(":visible")) {
//  alert(t)
  // $('*', this).tooltip('hide');
});
