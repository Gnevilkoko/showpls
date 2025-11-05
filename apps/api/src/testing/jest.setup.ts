import axios from "axios"

const url = `http://localhost:8000/api`
axios.defaults.baseURL = url
axios.defaults.validateStatus = (status) => status <= 500
axios.defaults.withCredentials = true
