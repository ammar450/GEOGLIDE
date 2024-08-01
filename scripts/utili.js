document.addEventListener("DOMContentLoaded", function() {                    

    const mapStylesContent = document.querySelector("#mapStylesContent");
    const allMaps = document.querySelector("#allMaps");

    const allIcons = [
        "/assets/icons/streets.png",
        "/assets/icons/light.png",
        "/assets/icons/outdoors.png",
        "/assets/icons/dark.png",
        "/assets/icons/streets.png",
        "/assets/icons/light.png",
        "/assets/icons/outdoors.png",
        "/assets/icons/dark.png",
        "/assets/icons/light.png",
        "/assets/icons/outdoors.png",
        "/assets/icons/dark.png",
        "/assets/icons/streets.png",
        "/assets/icons/light.png",
        "/assets/icons/outdoors.png",
        "/assets/icons/dark.png",
        "/assets/icons/light.png",
        "/assets/icons/outdoors.png",
    ];

    const html = `
        <div class="row">
            ${allIcons.map(icon => {
                const iconName = icon.split('/').pop().split('.')[0]; // Extracting icon name without extension
                return `
                    <div class="col-4 mb-3">
                        <button class="btn p-0 w-75">
                            <img class="img-fluid w-100" src="${icon}" alt="${iconName}">
                        </button>
                    </div>`;
            }).join('')}
        </div>
    `;

    allMaps.insertAdjacentHTML('afterbegin', html);
    mapStylesContent.insertAdjacentHTML('afterbegin', html);
    var options = {
        html: true,
        title: "Choose Style",
        //html element
        //content: $("#popover-content")
        content: document.querySelector('[data-name="popover-content"]')
        //  $('[data-name="popover-content"]')
        //Doing below won't work. Shows title only
        //content: $("#popover-content").html()

    }
    var exampleEl = document.getElementById('showMoreMapStyles')
    new bootstrap.Popover(exampleEl, options)


    // <!-- ========== Start Sidebar Tabs functioning ========== -->
    const sidebarTabsIDs = ['mainTab', "modeTab", "textTab", "uploadsTab", "mapsTab"];

    
    const openTab = (evt, tabName) => {
        var i, tabcontent, tablinks;
        tabcontent = document.querySelectorAll(".tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.querySelector('.'+tabName).style.display = "block";
        evt.currentTarget.className += " active";
    };

    sidebarTabsIDs.forEach(id =>{
        const tab = document.getElementById(id);
        tab.addEventListener('click', (e) => openTab(e, id))
    })
    // <!-- ========== End Sidebar Tabs functioning ========== -->



})