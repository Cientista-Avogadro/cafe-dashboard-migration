#!/bin/bash

# Arquivo de código fonte
FILE="server/storage.ts"

# Lista de entidades
ENTITIES=("deleteFarm" "deleteSector" "deleteLot" "deleteCrop" "deleteInput" "deleteIrrigation" "deletePest" "deleteTransaction" "deleteActivity")

# Para cada entidade
for entity in "${ENTITIES[@]}"; do
  # Substitui o retorno para usar !! para conversão para booleano
  sed -i "s/\(async $entity(.*\)return result.rowCount > 0;/\1return !!result.rowCount;/g" "$FILE"
done

echo "Substituições concluídas!"
