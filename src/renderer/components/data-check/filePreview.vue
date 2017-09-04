<template>
  <div class="webview">
    <webview
      v-loading.body="loading"
      :src="src"
      autosize
      minwidth="800" minheight="600"
      plugins
      @did-finish-load="afterLoad"
      class="webview">
    </webview>
  </div>
</template>

<script>
export default {
  data () {
    return {
      loading: true
    }
  },
  props: {
    src: String
  },
  methods: {
    afterLoad () {
      this.loading = false
    }
  }
}
</script>


<style>
.webview {
  width: 99%;
  height: 1000px;
}

</style>
