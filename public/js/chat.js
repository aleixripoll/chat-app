socket = io()

const msgForm = document.querySelector("#chat-form")
const msgFormInput = document.querySelector("input")
const msgFormButton = document.querySelector("button")
const locButton = document.querySelector("#send-location")
const messages = document.querySelector("#messages")

const messageTemplate = document.querySelector("#message-template").innerHTML
const locTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message.text)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('location', (location) => {
    console.log(location.url)
    const html = Mustache.render(locTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('H:mm')
    })
    messages.insertAdjacentHTML('beforeend', html)
})

msgForm.addEventListener('submit', (e) => {
    e.preventDefault()

    msgFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value
    socket.emit('sendMessage', msg, (error) => {
        msgFormButton.removeAttribute('disabled')
        msgFormInput.value = ''
        msgFormInput.focus()

        console.log('Message delivered')
    })
})

locButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation not supported")
    }

    locButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (msg) => {
            console.log(msg)
            locButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
