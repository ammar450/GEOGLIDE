document.addEventListener("DOMContentLoaded", function() {

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = document.querySelector('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    document.addEventListener('scroll', headerScrolled)

  }


  /// nitilaize the lightBox
  const lightbox = GLightbox({
    selector: '.glightbox'
  });

  
  
//// start Map Styles popup


                    
  var options = {
      html: true,
      title: "Optional: HELLO(Will overide the default-the inline title)",
      //html element
      //content: $("#popover-content")
      content: $('[data-name="popover-content"]')
      //Doing below won't work. Shows title only
      //content: $("#popover-content").html()

  }
  var exampleEl = document.getElementById('example')
  var popover = new bootstrap.Popover(exampleEl, options)
  //// End Map Styles popup



  
})

