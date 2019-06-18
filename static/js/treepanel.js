$(document).ready(function(){
    $(".file-tree").filetree({
        animationSpeed: 'fast',
        collapsed: true
    });

    $(".selectable-folder").on("click","li",function(e){
        // console.log(e.target.firstChild.getAttribute('data-name'));        
        $("#newFormFolder").val(e.target.firstChild.innerHTML);
    });

});
