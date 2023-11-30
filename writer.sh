#!/bin/bash
keyword="shimizu"

stty -F /dev/ttyS4 57600 raw

# シリアルポートからデータを読み込む無限ループ
while IFS= read -r line < /dev/ttyS4; do
  serial_data=$line

  # CPU使用率を取得
  cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')

  # メモリ使用量を取得
  mem_usage=$(free | grep Mem | awk '{print $7/$2 * 100.0}')

  # 現在のタイムスタンプを取得
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")

  # 結果をタブ区切りで出力
  printf "%s\t%s\t%s\t%s\t%s\n" "$timestamp" "$keyword" "$cpu_usage" "$mem_usage" "$serial_data"

done
