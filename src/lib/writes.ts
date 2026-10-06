/**
 * No SDK nativo a promessa de uma escrita só resolve quando o servidor confirma; offline ela
 * fica pendente até a internet voltar (a escrita já está salva na fila local e aparece na UI).
 * Aqui esperamos a confirmação por pouco tempo: online, erros (ex.: regra negada) chegam à tela;
 * offline, seguimos em frente e o Firestore sincroniza depois.
 */
export function settle(promise: Promise<unknown>, timeoutMs = 1500): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, timeoutMs)
    promise.then(
      () => {
        clearTimeout(timer)
        resolve()
      },
      error => {
        clearTimeout(timer)
        if (__DEV__) console.warn('Escrita no Firestore falhou:', error)
        reject(error)
      },
    )
  })
}
