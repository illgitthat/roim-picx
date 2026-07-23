import axios, { type AxiosRequestConfig } from 'axios'
import { ElNotification as elNotify } from 'element-plus'
import { ImgList, ImgDel, ImgReq, Folder, ImgItem, AuthToken } from "./types"
import storage from "./storage"
const request = axios.create({
	baseURL: import.meta.env.VITE_APP_API_URL,
	timeout: 200000
})

export const getRequestErrorMessage = (error: unknown) => {
	if (!axios.isAxiosError(error)) {
		return error instanceof Error ? error.message : String(error)
	}

	const data = error.response?.data
	if (typeof data === 'string' && data) {
		return data
	}
	if (data && typeof data === 'object') {
		const payload = data as { msg?: unknown; message?: unknown }
		if (typeof payload.msg === 'string' && payload.msg) {
			return payload.msg
		}
		if (typeof payload.message === 'string' && payload.message) {
			return payload.message
		}
	}

	return error.message || 'Request failed'
}

const silentRequestConfig: AxiosRequestConfig & { suppressErrorNotification: boolean } = {
	suppressErrorNotification: true
}

const suppressesErrorNotification = (config: unknown) => (
	typeof config === 'object'
	&& config !== null
	&& 'suppressErrorNotification' in config
	&& config.suppressErrorNotification === true
)

request.interceptors.request.use(
	(config) => {
		const token = storage.local.get('auth-token')
		if (token) {
			// @ts-ignore
			config.headers['Authorization'] = token
		}
		return config
	}
)

request.interceptors.response.use(
	(response) => {
		const data = response.data;
		// console.log(data)
		if (data.code === 401) {
			// 跳转到登陆页面
			// 移除token
			storage.local.remove('auth-token')
			window.location.href = '/auth'
			return Promise.reject(data.msg)
		}
		if (data.code !== 200) {
			if (!suppressesErrorNotification(response.config)) {
				elNotify({
					message: data.msg,
					duration: 5000,
					type: 'error'
				})
			}
			return Promise.reject(new Error(data.msg))
		}
		return data.data
	},
	(error) => {
		if (!suppressesErrorNotification(error?.config)) {
			elNotify({
				message: getRequestErrorMessage(error),
				duration: 5000,
				type: 'error'
			})
		}
		return Promise.reject(error)
	}
)

export const requestListImages = (data: ImgReq): Promise<ImgList> => request.post('/rest/list', data, silentRequestConfig)
export const requestUploadImages = (data: FormData): Promise<ImgItem[]> => request.post('/rest/upload', data, silentRequestConfig)
export const createFolder = (data: Folder) => request.post('/rest/folder', data, silentRequestConfig)
export const checkToken = (data: AuthToken) => request.post('/rest/checkToken', data, silentRequestConfig)
export const requestDeleteImage = (data: ImgDel) => request.delete('/rest', { data, ...silentRequestConfig })
