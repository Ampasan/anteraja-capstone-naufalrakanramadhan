<script src="https://widget.cloudinary.com/v2.0/global/all.js" type="text/javascript"></script>
<script type="text/javascript">
  var cloudName = <?php echo json_encode(Str::after(config('cloudinary.cloud_url'), '@'), 512) ?>;
  var uploadPreset = <?php echo json_encode(config('cloudinary.upload_preset'), 15, 512) ?>;
  var uploadRoute = <?php echo json_encode(config('cloudinary.upload_route'), 15, 512) ?>;

  function openWidget() {
    window.cloudinary.openUploadWidget({
        cloud_name: cloudName,
        upload_preset: uploadPreset
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          console.log('Done uploading..');
          localStorage.setItem("cloud_image_url", result.info.url);
          try {
            if (uploadRoute) {
              fetch(uploadRoute, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '<?php echo e(csrf_token()); ?>'
                  },
                  body: JSON.stringify({
                    cloud_image_url: result.info.url
                  })
                })
                .then(response => response.json())
                .then(data => {
                  console.log(data);
                })
                .catch(error => {
                  console.error('Error:', error);
                });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }).open();
  }
</script>

<button
  type="button"
  onclick="openWidget()"
  <?php echo e($attributes); ?>

>
  <?php echo e($slot); ?>

</button>
<?php /**PATH C:\xampp\htdocs\anteraja-capstone\backend\vendor\cloudinary-labs\cloudinary-laravel\views\components\widget.blade.php ENDPATH**/ ?>