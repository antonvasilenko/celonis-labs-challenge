# take first and all rest arguments in separate variables

SCRIPT_NAME=$1
# REST_ARGS should have all args except first one
REST_ARGS=${@:2}

SCRIPT="/opt/bitnami/kafka/bin/${SCRIPT_NAME}.sh --bootstrap-server kafka:9092 $REST_ARGS"
echo "Execing script: $SCRIPT"

# run docker exec
docker exec -it celonis-labs-backend-challenge-main-kafka-1 $SCRIPT