onmessage = async function({data}) {
    if(!data.hasOwnProperty("code")) return; //if not run
    let code = data.code;

    let outputBuffered = "";

    function output(str) {
        postMessage({"out": str});
    }

    const importObj = {
        module: {},
        env: {
            input: function() {
                let charCode = (data.input[0] || "").charCodeAt(0) || 0;
                data.input = data.input.substring(1);
                return charCode;
            },
            output: function(charCode) {
                outputBuffered += String.fromCharCode(charCode);

                if(outputBuffered.length > 1000) {
                    output(outputBuffered);
                    outputBuffered = "";
                }
            },
            nextChar: function() {
                let charCode = (code[0] || "").charCodeAt(0) || 0;
                code = code.substring(1);
                return charCode;
            },
            memory: new WebAssembly.Memory({ initial: 256 }),
            table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
        }
    };

    let wasm = await fetch("./rust_wasm.wasm");
    let instantiated = await WebAssembly.instantiateStreaming(wasm, importObj);
    let exports = instantiated.instance.exports;

    let status = exports.run();

    if(status === 0) {
        //success
    } else if(status === 1) {
        output("\nError: Unbalanced [ and ]");
    } else if(status === 2) {
        output("\nError: Pointer out of bounds!");
    } else {
        output("\nERR UNKNOWN STATUS "+status);
    }

    output(outputBuffered);

    postMessage({"done": true});
}