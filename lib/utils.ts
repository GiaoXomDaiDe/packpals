export function formatTime(minutes: number): string {
    const formattedMinutes = Math.floor(minutes || 0)

    if (formattedMinutes < 60) {
        return `${formattedMinutes} min`
    } else {
        const hours = Math.floor(formattedMinutes / 60)
        const remainingMinutes = formattedMinutes % 60
        return `${hours}h ${remainingMinutes}m`
    }
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const day = date.getDate()
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()

    return `${day < 10 ? '0' + day : day} ${month} ${year}`
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}
