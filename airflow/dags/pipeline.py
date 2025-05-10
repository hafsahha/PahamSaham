import docker
import os
from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount
from datetime import datetime

# Mendapatkan path host yang benar dari mount container saat ini
client = docker.from_env()
try:
    # Dapatkan container saat ini berdasarkan hostname (biasanya container ID)
    current_container = client.containers.get(os.environ['HOSTNAME'])
    for mount in current_container.attrs['Mounts']:
        if mount['Destination'] == '/opt/airflow/output':
            host_output_path = mount['Source']  # Path absolut di host, misalnya /path/to/project/output
            break
    else:
        raise Exception("Mount point /opt/airflow/output not found in container")
except Exception as e:
    print(f"Error getting host output path: {e}")
    # Fallback ke path default jika gagal (opsional, sesuaikan dengan kebutuhan)
    host_output_path = "/path/to/fallback/output"

print("Host output path:", host_output_path)

# Lanjutkan dengan definisi default_args dan DAG seperti sebelumnya
default_args = {
    'owner': 'airflow',
    'start_date': datetime(2023, 1, 1),
    'retries': 1
}

with DAG(
    dag_id='saham_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False,
    tags=['saham'],
) as dag:
    # TASK: YFINANCE
    extract_yfinance = DockerOperator(
        task_id='extract_yfinance',
        image='extraction:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python yfinance_extract.py",
        container_name="pipeline_extract_yfinance",
        environment={
            'YFINANCE_OUTPUT_PATH': '/app/output/yfinance_output.json'
        },
    )
    
    load_yfinance = DockerOperator(
        task_id='load_yfinance',
        image='loader:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,
        mounts=[
            Mount(source=host_output_path, target='/app/output', type='bind')
        ],
        command="python yfinance_load.py",
        container_name="pipeline_load_yfinance"
    )
    
    extract_yfinance >> load_yfinance