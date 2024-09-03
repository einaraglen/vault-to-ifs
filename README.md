# vault-to-ifs

IFS Provider copied from https://github.com/sjc-syjupl/ifs-ap
With minor changes to allow for OS-USER header to be added in requests

# Dev
`npm run dev`

# Test
`npm run test`

# Build
`npm run build` 

# For Protobuf
`npx protoc --ts_out . --ts_opt long_type_number --proto_path .\src\models\proto\ .\src\models\proto\<file>.proto`