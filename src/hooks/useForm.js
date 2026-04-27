import { useState } from 'react'

export function useForm(initialValues) {
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setValues((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: '' }))
    }

    const reset = () => {
        setValues(initialValues)
        setErrors({})
    }

    return { values, errors, setErrors, handleChange, reset }
}
