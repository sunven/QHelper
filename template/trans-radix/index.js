let radixConvert = (num, fromRadix, toRadix) => {
  console.log(num, fromRadix, toRadix)
  return parseInt(num, fromRadix).toString(toRadix)
}
const { createApp } = Vue
const { Bottom, Top } = ElementPlusIconsVue

app = createApp({
  data() {
    return {
      Bottom,
      Top,
      radixRadio1: 10,
      radixSelect1: 0,
      value1: '',
      radixRadio2: 2,
      radixSelect2: 0,
      value2: '',
      radixRadioGroupList: [2, 10, 16],
    }
  },
  computed: {
    radix1() {
      return this.radixSelect1 ? this.radixSelect1 : this.radixRadio1
    },
    radix2() {
      return this.radixSelect2 ? this.radixSelect2 : this.radixRadio2
    },
  },
  methods: {
    value1Change() {
      this.value2 = radixConvert(this.value1, this.radix1, this.radix2)
    },
    value2Change() {
      this.value1 = radixConvert(this.value2, this.radix2, this.radix1)
    },
  },
})
  .use(ElementPlus)
  .use(ElementPlusIconsVue)
  .mount('#app')
