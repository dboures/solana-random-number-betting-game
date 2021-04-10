export const loadTokensInEscrow = async (escrowTokenAccount: string) => {

    let tokenResponse;
    await fetch("http://localhost:8899", {
        method: "POST",headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ jsonrpc:"2.0", id:1, method:"getTokenAccountBalance", params:[escrowTokenAccount]}),
        }).then((res) => {
            tokenResponse = res.json();
        }).catch(error => console.log(error));

    return tokenResponse;
}
 