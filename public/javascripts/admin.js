$(document).ready(function(){
    $('.deleteUser').on('click', function(e){
        e.preventDefault();
        var id = $(this).data().id;
        if(confirm('Do you want to remove: ' + $(this).data().page)){
            $.ajax({
                url: '/users/' + id,
                type: 'DELETE',
                data: {id: $(this).data().id},
                //alert($(this).data().userid);
                success: function(result) {
                    window.location.href = '/users'
                }
            });
        }
    });
});