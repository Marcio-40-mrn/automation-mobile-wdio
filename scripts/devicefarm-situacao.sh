#!/usr/bin/env bash
# Situação de cada aparelho de um ou mais runs do Device Farm, para o log e o resumo da esteira:
# quanto tempo o aparelho esperou na fila da AWS, se ainda está na fila, rodando ou se terminou,
# e se a AWS não conseguiu alocar o aparelho ("Unable to acquire device").
#
# Por que existe: no Mobile Tests #51 (2026-11-06) os Samsung esperaram de 1h02 a 1h56 por aparelho
# livre na frota pública (a conta não tem aparelho dedicado), o run passou de 2h e a esteira saiu
# só com "Timeout aguardando o Device Farm", sem dizer que o motivo era fila e não teste.
#
# O início no aparelho é o `created` da 1ª suite do job: no Device Farm as suites só são criadas
# quando o aparelho é alocado (conferido nos runs Android #40 a #51).
#
# Uso:   bash scripts/devicefarm-situacao.sh <run-arn> [<run-arn> ...]
# Saída: uma linha Markdown por aparelho e, na última linha, "FILA=<n> RODANDO=<n> SEM_APARELHO=<n>".
set -u
REGIAO="${AWS_DEFAULT_REGION:-us-west-2}"
hora() { TZ=America/Sao_Paulo date -d "@$1" +%H:%M; }

FILA=0
RODANDO=0
SEM_APARELHO=0
AGORA=$(date +%s)

for RUN in "$@"; do
  CRIADO=$(aws devicefarm get-run --arn "$RUN" --region "$REGIAO" --query 'run.created' --output text)
  T0=$(date -d "$CRIADO" +%s)
  for JOB in $(aws devicefarm list-jobs --arn "$RUN" --region "$REGIAO" --query 'jobs[].arn' --output text); do
    # --output text separa os campos por tab; campo ausente vem como "None".
    IFS=$'\t' read -r NOME ST RES MSG < <(aws devicefarm get-job --arn "$JOB" --region "$REGIAO" \
      --query 'job.[device.name,status,result,message]' --output text | tr -d '\r')
    [ "${MSG:-}" = "None" ] && MSG=""
    INICIO=$(aws devicefarm list-suites --arn "$JOB" --region "$REGIAO" --query 'suites[0].created' --output text 2>/dev/null)
    T1=""
    if [ -n "$INICIO" ] && [ "$INICIO" != "None" ]; then T1=$(date -d "$INICIO" +%s); fi

    case "${MSG:-}" in
      *"Unable to acquire device"*)
        SEM_APARELHO=$((SEM_APARELHO+1))
        echo "- **$NOME** — a AWS não conseguiu alocar o aparelho (\"Unable to acquire device\"); nenhum teste rodou nele"
        continue ;;
    esac

    if [ -n "$T1" ]; then ESPERA=$(( (T1 - T0) / 60 )); fi
    if [ "$ST" = "COMPLETED" ]; then
      if [ -n "$T1" ]; then
        echo "- **$NOME** — terminou: \`$RES\` · esperou ${ESPERA} min por aparelho livre"
      else
        echo "- **$NOME** — terminou sem rodar: \`$RES\` ${MSG:+— $MSG}"
      fi
    elif [ -z "$T1" ]; then
      FILA=$((FILA+1))
      echo "- **$NOME** — na fila da AWS, esperando aparelho livre há $(( (AGORA - T0) / 60 )) min (\`$ST\`)"
    else
      RODANDO=$((RODANDO+1))
      echo "- **$NOME** — rodando desde $(hora "$T1") · esperou ${ESPERA} min por aparelho livre"
    fi
  done
done

echo "FILA=$FILA RODANDO=$RODANDO SEM_APARELHO=$SEM_APARELHO"
