from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount  
from datetime import datetime

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

    # Mount path should match what's in docker-compose.yml
    output_mount = Mount(
        source="./output",  # This path is relative to your docker-compose.yml location
        target="/app/output",
        type="bind"
    )

    # TASK: YFINANCE
    extract_yfinance = DockerOperator(
        task_id='extract_yfinance',
        image='extraction:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",  # Make sure this network exists
        mount_tmp_dir=False,  # Disable temp directory mounting
        mounts=[output_mount],
        command="python yfinance_extract.py",
        container_name="pipeline_extract_yfinance"
    )

    load_yfinance = DockerOperator(
        task_id='load_yfinance',
        image='loader:latest',
        auto_remove=True,
        docker_url="unix://var/run/docker.sock",
        network_mode="saham_net",
        mount_tmp_dir=False,  # Disable temp directory mounting
        mounts=[output_mount],
        command="python yfinance_load.py",
        container_name="pipeline_load_yfinance"
    )

    # # TASK: IDX
    # extract_idx = DockerOperator(
    #     task_id='extract_idx',
    #     image='extraction:latest',
    #     auto_remove=True,
    #     docker_url="unix://var/run/docker.sock",
    #     network_mode="saham_net",
    #     mount_tmp_dir=False,  # Disable temp directory mounting
    #     mounts=[output_mount],
    #     command="python idx_extract.py",
    # )

    # load_idx = DockerOperator(
    #     task_id='load_idx',
    #     image='loader:latest',
    #     auto_remove=True,
    #     docker_url="unix://var/run/docker.sock", 
    #     network_mode="saham_net",
    #     mount_tmp_dir=False,  # Disable temp directory mounting
    #     mounts=[output_mount],
    #     command="python idx_load.py",
    # )

    # SET DEPENDENSI
    extract_yfinance >> load_yfinance
    # extract_idx >> load_idx